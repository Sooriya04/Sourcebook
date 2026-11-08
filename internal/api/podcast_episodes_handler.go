package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

func (a *API) HandleListEpisodes(w http.ResponseWriter, r *http.Request) {
	notebookID := r.URL.Query().Get("notebook_id")
	if notebookID == "" {
		parts := strings.Split(r.URL.Path, "/")
		if len(parts) > 0 {
			notebookID = parts[len(parts)-1]
		}
	}

	if r.Method == http.MethodDelete {
		a.handleDeleteEpisode(w, r, notebookID)
		return
	}

	if r.Method == http.MethodPut || r.Method == http.MethodPatch {
		a.handleRenameEpisode(w, r, notebookID)
		return
	}

	audioURL := os.Getenv("AUDIO_SERVICE_URL")
	if audioURL == "" {
		audioURL = "http://127.0.0.1:6003"
	}

	client := &http.Client{Timeout: 3 * time.Second}
	if resp, err := client.Get(fmt.Sprintf("%s/episodes/%s", strings.TrimRight(audioURL, "/"), notebookID)); err == nil && resp.StatusCode == http.StatusOK {
		defer resp.Body.Close()
		w.Header().Set("Content-Type", "application/json")
		io.Copy(w, resp.Body)
		return
	}

	var eps []map[string]interface{}
	if files, err := os.ReadDir(fmt.Sprintf("database/audio/%s", notebookID)); err == nil {
		for _, f := range files {
			if strings.HasSuffix(f.Name(), ".json") {
				if b, err := os.ReadFile(fmt.Sprintf("database/audio/%s/%s", notebookID, f.Name())); err == nil {
					var item map[string]interface{}
					if json.Unmarshal(b, &item) == nil {
						item["id"] = strings.TrimSuffix(f.Name(), ".json")
						eps = append(eps, item)
					}
				}
			}
		}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"episodes": eps})
}

func (a *API) handleDeleteEpisode(w http.ResponseWriter, r *http.Request, notebookID string) {
	epID := r.URL.Query().Get("episode_id")
	if notebookID != "" && epID != "" {
		_ = os.Remove(fmt.Sprintf("database/audio/%s/%s.json", notebookID, epID))
		_ = os.Remove(fmt.Sprintf("database/audio/%s/%s.wav", notebookID, epID))
		rootPath := fmt.Sprintf("database/audio/%s.json", notebookID)
		if b, err := os.ReadFile(rootPath); err == nil {
			var rootData map[string]interface{}
			if json.Unmarshal(b, &rootData) == nil && (rootData["id"] == epID || epID == "legacy_1") {
				_ = os.Remove(rootPath)
				_ = os.Remove(fmt.Sprintf("database/audio/%s.wav", notebookID))
			}
		}
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

func (a *API) handleRenameEpisode(w http.ResponseWriter, r *http.Request, notebookID string) {
	var req struct {
		NotebookID string `json:"notebook_id"`
		EpisodeID  string `json:"episode_id"`
		Title      string `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || strings.TrimSpace(req.Title) == "" {
		http.Error(w, "Invalid rename payload", http.StatusBadRequest)
		return
	}
	if req.NotebookID == "" {
		req.NotebookID = notebookID
	}
	if req.EpisodeID == "" {
		req.EpisodeID = r.URL.Query().Get("episode_id")
	}

	target := fmt.Sprintf("database/audio/%s/%s.json", req.NotebookID, req.EpisodeID)
	if b, err := os.ReadFile(target); err == nil {
		var data map[string]interface{}
		if json.Unmarshal(b, &data) == nil {
			data["title"] = req.Title
			if out, err := json.MarshalIndent(data, "", "  "); err == nil {
				_ = os.WriteFile(target, out, 0644)
			}
		}
	}
	rootPath := fmt.Sprintf("database/audio/%s.json", req.NotebookID)
	if b, err := os.ReadFile(rootPath); err == nil {
		var rootData map[string]interface{}
		if json.Unmarshal(b, &rootData) == nil && (rootData["id"] == req.EpisodeID || req.EpisodeID == "legacy_1") {
			rootData["title"] = req.Title
			if out, err := json.MarshalIndent(rootData, "", "  "); err == nil {
				_ = os.WriteFile(rootPath, out, 0644)
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"success": true, "title": req.Title})
}

func (a *API) HandleListVoices(w http.ResponseWriter, r *http.Request) {
	audioURL := os.Getenv("AUDIO_SERVICE_URL")
	if audioURL == "" {
		audioURL = "http://127.0.0.1:6003"
	}
	client := &http.Client{Timeout: 3 * time.Second}
	if resp, err := client.Get(fmt.Sprintf("%s/voices", strings.TrimRight(audioURL, "/"))); err == nil && resp.StatusCode == http.StatusOK {
		defer resp.Body.Close()
		w.Header().Set("Content-Type", "application/json")
		io.Copy(w, resp.Body)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(VoicesResponse{Voices: []VoiceProfile{
		{ID: "am_adam", Name: "Adam", Gender: "male", Accent: "American", Style: "Warm & dynamic"},
		{ID: "bm_george", Name: "George", Gender: "male", Accent: "British", Style: "Refined & articulate"},
		{ID: "af_bella", Name: "Bella", Gender: "female", Accent: "American", Style: "Expressive & conversational"},
	}})
}
