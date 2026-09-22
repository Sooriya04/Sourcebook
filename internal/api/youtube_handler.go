package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

// HandleYouTubeTranscript proxies YouTube transcript requests to the standalone microservice
// or falls back to local direct Python execution.
func (a *API) HandleYouTubeTranscript(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		URL string `json:"url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.URL == "" {
		http.Error(w, "Valid 'url' parameter is required", http.StatusBadRequest)
		return
	}

	title := FetchYouTubeTitle(r.Context(), req.URL)
	if title == "" || title == "YouTube Video" {
		title = "YouTube Transcript"
	}

	ytServiceURL := ""
	if a.repo != nil {
		if s, err := a.repo.GetSettings(); err == nil && s.YoutubeServiceURL != "" {
			ytServiceURL = s.YoutubeServiceURL
		}
	}
	if ytServiceURL == "" {
		ytServiceURL = os.Getenv("YOUTUBE_SERVICE_URL")
	}
	if ytServiceURL == "" {
		ytServiceURL = "http://127.0.0.1:6001"
	}

	endpoint := fmt.Sprintf("%s/youtube/transcript", ytServiceURL)
	bodyBytes, _ := json.Marshal(map[string]string{"url": req.URL})
	ytReq, err := http.NewRequestWithContext(r.Context(), "POST", endpoint, bytes.NewBuffer(bodyBytes))
	if err == nil {
		ytReq.Header.Set("Content-Type", "application/json")
		client := &http.Client{Timeout: 30 * time.Second}
		resp, doErr := client.Do(ytReq)
		if doErr == nil {
			defer resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				var result struct {
					Text string `json:"text"`
				}
				if json.NewDecoder(resp.Body).Decode(&result) == nil && result.Text != "" {
					w.Header().Set("Content-Type", "application/json")
					json.NewEncoder(w).Encode(map[string]interface{}{
						"success": true,
						"url":     req.URL,
						"title":   title,
						"content": result.Text,
						"type":    "youtube",
					})
					return
				}
			}
		}
	}

	// Fallback to direct local Python execution
	log.Printf("[YouTube] Microservice offline, running direct local python fallback for %s", req.URL)
	text, fbErr := fetchLocalYouTubeTranscript(req.URL)
	if fbErr != nil {
		log.Printf("[YouTube] Local python fallback failed: %v", fbErr)
		http.Error(w, fmt.Sprintf("Failed to extract YouTube transcript: %v", fbErr), http.StatusBadGateway)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"url":     req.URL,
		"title":   title,
		"content": text,
		"type":    "youtube",
	})
}
