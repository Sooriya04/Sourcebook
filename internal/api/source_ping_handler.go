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

	// Fast ping with 1.5 second timeout
	client := &http.Client{
		Timeout: 1500 * time.Millisecond,
	}

	resp, err := client.Head(req.URL)
	online := false
	statusCode := 0

	if err == nil {
		online = (resp.StatusCode >= 200 && resp.StatusCode < 400)
		statusCode = resp.StatusCode
		resp.Body.Close()
	} else {
		// Try GET request as fallback if HEAD fails (some servers reject HEAD)
		resp, err = client.Get(req.URL)
		if err == nil {
			online = (resp.StatusCode >= 200 && resp.StatusCode < 400)
			statusCode = resp.StatusCode
			resp.Body.Close()
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(pingResponse{
		URL:    req.URL,
		Online: online,
		Status: statusCode,
	})
}
