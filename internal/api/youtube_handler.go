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

// HandleYouTubeTranscript proxies YouTube transcript requests to the standalone Python microservice.
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

	ytServiceURL := os.Getenv("YOUTUBE_SERVICE_URL")
	if ytServiceURL == "" {
		http.Error(w, "YOUTUBE_SERVICE_URL environment variable is not configured", http.StatusInternalServerError)
		return
	}

	log.Printf("[YouTube] Forwarding transcript request for URL %q to %s", req.URL, ytServiceURL)

	bodyBytes, _ := json.Marshal(map[string]string{"url": req.URL})
	ytReq, err := http.NewRequestWithContext(r.Context(), "POST", ytServiceURL, bytes.NewBuffer(bodyBytes))
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to create request: %v", err), http.StatusInternalServerError)
		return
	}
	ytReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(ytReq)
	if err != nil {
		log.Printf("[YouTube] Service error: %v", err)
		http.Error(w, fmt.Sprintf("YouTube transcript service unavailable: %v", err), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	if resp.StatusCode != http.StatusOK {
		log.Printf("[YouTube] Microservice returned status %d: %s", resp.StatusCode, string(respBody))
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(resp.StatusCode)
		w.Write(respBody)
		return
	}

	var result struct {
		Text string `json:"text"`
	}
	if err := json.Unmarshal(respBody, &result); err != nil {
		http.Error(w, "Failed to parse transcript response", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"url":     req.URL,
		"title":   "YouTube Transcript",
		"content": result.Text,
		"type":    "youtube",
	})
}
