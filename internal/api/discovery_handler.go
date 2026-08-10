package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"sync"
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
		searqonURL = "http://127.0.0.1:4001"
	}

	log.Printf("[Discovery] Initiating fast discovery search for query: %q", req.Query)
	startTime := time.Now()

	settings, err := a.repo.GetSettings()
	if err != nil {
		log.Printf("[Discovery] Warning: Failed to get settings (%v), using default settings", err)
		settings = &models.UserSettings{
			SearchProvider:    "duckduckgo",
			MaxSources:        5,
			SearxngSplit:      3,
			DdgSplit:          2,
			YoutubeEnabled:    false,
			YoutubeMaxSources: 3,
		}
	}

	var mu sync.Mutex
	var webResults []models.SearchResult
	var ytResults []models.SearchResult
	var wg sync.WaitGroup

	// 1. Web Search (Searqon /search scrape=false or Fallback Controller)
	wg.Add(1)
	go func() {
		defer wg.Done()

		searchBody, _ := json.Marshal(map[string]interface{}{
			"query":  req.Query,
			"limit":  req.Limit,
			"scrape": false,
		})

		searchEndpoint := fmt.Sprintf("%s/search", searqonURL)
		searchReq, err := http.NewRequestWithContext(r.Context(), "POST", searchEndpoint, bytes.NewBuffer(searchBody))
		if err == nil {
			searchReq.Header.Set("Content-Type", "application/json")
			client := &http.Client{Timeout: 15 * time.Second}
			resp, err := client.Do(searchReq)
			if err == nil && resp.StatusCode == http.StatusOK {
				defer resp.Body.Close()
				var rawSearqon struct {
					Success bool `json:"success"`
					Data    struct {
						Results []models.SearchResult `json:"results"`
					} `json:"data"`
				}
				if decodeErr := json.NewDecoder(resp.Body).Decode(&rawSearqon); decodeErr == nil && rawSearqon.Success && len(rawSearqon.Data.Results) > 0 {
					log.Printf("[Discovery] Searqon discovery completed successfully (%d results) in %v.", len(rawSearqon.Data.Results), time.Since(startTime))
					mu.Lock()
					webResults = rawSearqon.Data.Results
					mu.Unlock()
					return
				} else if decodeErr != nil {
					log.Printf("[Discovery] Searqon JSON decode error: %v", decodeErr)
				}
			}
			if resp != nil {
				resp.Body.Close()
			}
		}

		log.Printf("[Discovery] Searqon discovery unavailable/empty. Falling back to direct search controller...")

		options := models.SearchOptions{
			Web:          true,
			Provider:     settings.SearchProvider,
			MaxResults:   settings.MaxSources,
			SearxngLimit: settings.SearxngSplit,
			DdgLimit:     settings.DdgSplit,
		}

		results, searchErr := a.searchController.Search(r.Context(), req.Query, options)
		if searchErr != nil {
			log.Printf("[Discovery] Direct search controller fallback error: %v", searchErr)
		} else if results != nil {
			mu.Lock()
			webResults = results
			mu.Unlock()
		}
	}()

	// 2. YouTube Discovery (if enabled)
	if settings.YoutubeEnabled && settings.YoutubeMaxSources > 0 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			res, err := DiscoverYouTubeMetadata(r.Context(), req.Query, settings.YoutubeMaxSources)
			if err == nil && res != nil {
				mu.Lock()
				ytResults = res
				mu.Unlock()
			} else if err != nil {
				log.Printf("[Discovery] YouTube discovery notice: %v", err)
			}
		}()
	}

	wg.Wait()

	allResults := append([]models.SearchResult{}, webResults...)
	if len(ytResults) > 0 {
		allResults = append(allResults, ytResults...)
	}

	if allResults == nil {
		allResults = []models.SearchResult{}
	}

	w.Header().Set("Content-Type", "application/json")

	// Opportunistically trigger one background scrape repair cycle.
	// Non-blocking — does not delay the discovery response.
	go a.sentinel.Trigger(r.Context())

	json.NewEncoder(w).Encode(map[string]interface{}{
		"query":   req.Query,
		"count":   len(allResults),
		"results": allResults,
	})
}
