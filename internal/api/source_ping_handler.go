package api

import (
	"encoding/json"
	"net/http"
	"time"
)

type pingRequest struct {
	URL string `json:"url"`
}

type pingResponse struct {
	URL    string `json:"url"`
	Online bool   `json:"online"`
	Status int    `json:"status"`
}

func (a *API) HandleSourcePing(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req pingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid payload", http.StatusBadRequest)
		return
	}

	if req.URL == "" {
		http.Error(w, "URL is required", http.StatusBadRequest)
		return
	}

	client := &http.Client{
		Timeout: 3500 * time.Millisecond,
	}

	reqHead, err := http.NewRequestWithContext(r.Context(), "HEAD", req.URL, nil)
	online := false
	statusCode := 0

	if err == nil {
		reqHead.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
		reqHead.Header.Set("Accept", "*/*")
		resp, headErr := client.Do(reqHead)
		if headErr == nil {
			statusCode = resp.StatusCode
			online = (resp.StatusCode >= 200 && resp.StatusCode < 400)
			resp.Body.Close()
		}
	}

	if !online {
		reqGet, getErr := http.NewRequestWithContext(r.Context(), "GET", req.URL, nil)
		if getErr == nil {
			reqGet.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
			reqGet.Header.Set("Accept", "*/*")
			reqGet.Header.Set("Range", "bytes=0-1024")
			resp, doErr := client.Do(reqGet)
			if doErr == nil {
				statusCode = resp.StatusCode
				online = (resp.StatusCode >= 200 && resp.StatusCode < 500)
				resp.Body.Close()
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pingResponse{
		URL:    req.URL,
		Online: online,
		Status: statusCode,
	})
}
