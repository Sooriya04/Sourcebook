package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"sourcebook/internal/models"
)

// HandleDiscovery uses Searqon's /search endpoint with scrape: false for instant source discovery.
func (a *API) HandleDiscovery(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Query string `json:"query"`
		Limit int    `json:"limit"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Query == "" {
		http.Error(w, "Query is required", http.StatusBadRequest)
		return
	}

	if req.Limit <= 0 || req.Limit > 10 {
		req.Limit = 10
	}

	searqonURL := os.Getenv("SEARQON_URL")
	if searqonURL == "" {
		http.Error(w, "SEARQON_URL environment variable is not set", http.StatusInternalServerError)
		return
	}

	log.Printf("[Discovery] Initiating fast discovery search for query: %q", req.Query)
	startTime := time.Now()

	settings, err := a.repo.GetSettings()
	if err != nil {
		log.Printf("[Discovery] Failed to get settings: %v", err)
		http.Error(w, fmt.Sprintf("Failed to get settings: %v", err), http.StatusInternalServerError)
		return
	}

	errChan := make(chan error, 2)
	var searqonData struct {
		Query   string                `json:"query"`
		Count   int                   `json:"count"`
		Results []models.SearchResult `json:"results"`
	}
	var ytResults []models.SearchResult

	// 1. Web Search (Searqon /search scrape=false)
	go func() {
		searchBody, _ := json.Marshal(map[string]interface{}{
			"query":  req.Query,
			"limit":  req.Limit,
			"scrape": false,
		})

		searchEndpoint := fmt.Sprintf("%s/search", searqonURL)
		searchReq, err := http.NewRequestWithContext(r.Context(), "POST", searchEndpoint, bytes.NewBuffer(searchBody))
		if err != nil {
			errChan <- err
			return
		}
		searchReq.Header.Set("Content-Type", "application/json")

		log.Printf("[Discovery] Calling Searqon discovery endpoint: %s", searchEndpoint)

		client := &http.Client{Timeout: 5 * time.Second}
		resp, err := client.Do(searchReq)
		if err == nil && resp.StatusCode == http.StatusOK {
			defer resp.Body.Close()
			var rawSearqon struct {
				Success bool                  `json:"success"`
				Data    []models.SearchResult `json:"data"`
			}
			if decodeErr := json.NewDecoder(resp.Body).Decode(&rawSearqon); decodeErr == nil && rawSearqon.Success {
				log.Printf("[Discovery] Searqon discovery completed successfully in %v.", time.Since(startTime))
				searqonData.Query = req.Query
				searqonData.Results = rawSearqon.Data
				searqonData.Count = len(rawSearqon.Data)
				errChan <- nil
				return
			}
		}

		if resp != nil {
			resp.Body.Close()
		}

		log.Printf("[Discovery] Searqon offline or failed (%v). Falling back to direct controller.", err)

		options := models.SearchOptions{
			Web:          true,
			Provider:     settings.SearchProvider,
			MaxResults:   settings.MaxSources,
			SearxngLimit: settings.SearxngSplit,
			DdgLimit:     settings.DdgSplit,
		}

		// Fallback to direct search controller
		results, searchErr := a.searchController.Search(r.Context(), req.Query, options)
		if searchErr == nil && results != nil {
			searqonData.Query = req.Query
			searqonData.Results = results
			searqonData.Count = len(results)
		}
		errChan <- searchErr
	}()

	// 2. YouTube Discovery (if enabled)
	go func() {
		if settings.YoutubeEnabled && settings.YoutubeMaxSources > 0 {
			res, err := DiscoverYouTubeMetadata(r.Context(), req.Query, settings.YoutubeMaxSources)
			if err == nil && res != nil {
				ytResults = res
			}
		}
		errChan <- nil // Non-fatal
	}()

	// Wait for Web Search
	if err := <-errChan; err != nil {
		http.Error(w, fmt.Sprintf("Search discovery failed: %v", err), http.StatusInternalServerError)
		return
	}

	// Wait for YouTube Search
	<-errChan

	if ytResults != nil && len(ytResults) > 0 {
		searqonData.Results = append(searqonData.Results, ytResults...)
		searqonData.Count = len(searqonData.Results)
	}

	if searqonData.Results == nil {
		searqonData.Results = []models.SearchResult{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(searqonData)
}
