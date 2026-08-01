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

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(searchReq)
	if err != nil {
		log.Printf("[Discovery] Searqon request failed after %v: %v", time.Since(startTime), err)
		http.Error(w, fmt.Sprintf("Searqon API failed: %v", err), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Printf("[Discovery] Failed to read Searqon response: %v", err)
		http.Error(w, "Failed to read response", http.StatusInternalServerError)
		return
	}

	log.Printf("[Discovery] Searqon responded with status %d in %v", resp.StatusCode, time.Since(startTime))

	if resp.StatusCode != http.StatusOK {
		log.Printf("[Discovery] Searqon returned error: %s", string(body))
		http.Error(w, fmt.Sprintf("Searqon returned %d", resp.StatusCode), http.StatusBadGateway)
		return
	}

	// We just proxy the JSON back to the frontend
	log.Printf("[Discovery] Fast discovery completed successfully. Returning payload to frontend.")

	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}
