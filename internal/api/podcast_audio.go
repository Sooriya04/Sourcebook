package api

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func isValidID(id string) bool {
	if id == "" || len(id) > 128 {
		return false
	}
	for _, ch := range id {
		if !((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || (ch >= '0' && ch <= '9') || ch == '-' || ch == '_') {
			return false
		}
	}
	return true
}

func isSafeAudioPath(baseDir, targetPath string) bool {
	cleanBase, err := filepath.Abs(baseDir)
	if err != nil {
		return false
	}
	cleanTarget, err := filepath.Abs(targetPath)
	if err != nil {
		return false
	}
	return strings.HasPrefix(cleanTarget, cleanBase+string(filepath.Separator))
}

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

	if !isValidID(notebookID) || (episodeID != "" && !isValidID(episodeID)) {
		http.Error(w, "Invalid notebook or episode ID", http.StatusBadRequest)
		return
	}

	baseAudioDir := filepath.Join("database", "audio")

	w.Header().Set("Cache-Control", "no-cache, no-store, must-revalidate")
	w.Header().Set("Pragma", "no-cache")
	w.Header().Set("Expires", "0")

	if r.URL.Query().Get("meta") == "true" || strings.HasSuffix(r.URL.Path, ".json") {
		var metaPath string
		if episodeID != "" {
			metaPath = filepath.Join(baseAudioDir, notebookID, fmt.Sprintf("%s.json", episodeID))
		} else {
			metaPath = filepath.Join(baseAudioDir, fmt.Sprintf("%s.json", notebookID))
		}
		if !isSafeAudioPath(baseAudioDir, metaPath) {
			http.Error(w, "Access denied", http.StatusForbidden)
			return
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
		audioPath = filepath.Join(baseAudioDir, notebookID, fmt.Sprintf("%s.wav", episodeID))
	} else {
		audioPath = filepath.Join(baseAudioDir, fmt.Sprintf("%s.wav", notebookID))
	}
	if !isSafeAudioPath(baseAudioDir, audioPath) {
		http.Error(w, "Access denied", http.StatusForbidden)
		return
	}
	if _, err := os.Stat(audioPath); os.IsNotExist(err) {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Content-Type", "audio/wav")
	http.ServeFile(w, r, audioPath)
}
