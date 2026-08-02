package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
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

	// 1. First part of the "double call": Search without scraping
	searchBody, _ := json.Marshal(map[string]interface{}{
		"query":  req.Query,
		"limit":  req.Limit,
		"scrape": false, // CRITICAL: This makes the API return instantly without downloading pages
	})

	searchEndpoint := fmt.Sprintf("%s/search", searqonURL)
	searchReq, err := http.NewRequestWithContext(r.Context(), "POST", searchEndpoint, bytes.NewBuffer(searchBody))
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to build request: %v", err), http.StatusInternalServerError)
		return
	}
	searchReq.Header.Set("Content-Type", "application/json")

	log.Printf("[Discovery] Calling Searqon discovery endpoint: %s", searchEndpoint)

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(searchReq)
	if err == nil && resp.StatusCode == http.StatusOK {
		defer resp.Body.Close()
		body, err := io.ReadAll(resp.Body)
		if err == nil {
			log.Printf("[Discovery] Searqon discovery completed successfully in %v.", time.Since(startTime))
			w.Header().Set("Content-Type", "application/json")
			w.Write(body)
			return
		}
	}

	if resp != nil {
		resp.Body.Close()
	}

	log.Printf("[Discovery] Searqon offline or failed (%v). Falling back to direct SearXNG controller.", err)

	// Fallback to direct SearXNG search
	results, searchErr := a.searchController.Search(r.Context(), req.Query, models.SearchOptions{Web: true})
	if searchErr != nil {
		log.Printf("[Discovery] Fallback search also failed: %v", searchErr)
		http.Error(w, fmt.Sprintf("Search discovery failed: %v", searchErr), http.StatusInternalServerError)
		return
	}

	if results == nil {
		results = []models.SearchResult{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"query":   req.Query,
		"results": results,
		"count":   len(results),
	})
}
