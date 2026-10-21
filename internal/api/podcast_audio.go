package api

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// HandleGetPodcastAudio serves raw audio or JSON metadata for an episode.
func (a *API) HandleGetPodcastAudio(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) == 0 {
		http.NotFound(w, r)
		return
	}
	notebookID := parts[len(parts)-1]
	notebookID = strings.TrimSuffix(notebookID, ".wav")
	notebookID = strings.TrimSuffix(notebookID, ".json")
	episodeID := r.URL.Query().Get("episode")

	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")

	if r.URL.Query().Get("meta") == "true" || strings.HasSuffix(r.URL.Path, ".json") {
		var metaPath string
		if episodeID != "" {
			metaPath = filepath.Join("database", "audio", notebookID, fmt.Sprintf("%s.json", episodeID))
		} else {
			metaPath = filepath.Join("database", "audio", fmt.Sprintf("%s.json", notebookID))
		}
		if data, err := os.ReadFile(metaPath); err == nil {
			w.Header().Set("Content-Type", "application/json")
			w.Write(data)
			return
		}
		http.NotFound(w, r)
		return
	}

	var audioPath string
	if episodeID != "" {
		audioPath = filepath.Join("database", "audio", notebookID, fmt.Sprintf("%s.wav", episodeID))
	} else {
		audioPath = filepath.Join("database", "audio", fmt.Sprintf("%s.wav", notebookID))
	}
	if _, err := os.Stat(audioPath); os.IsNotExist(err) {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Content-Type", "audio/wav")
	http.ServeFile(w, r, audioPath)
}
