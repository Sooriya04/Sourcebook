package api

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

// RegisterStaticSPA mounts the React production build at distDir to the root of mux.
// It serves static assets directly and falls back to index.html for client-side routing.
func RegisterStaticSPA(mux *http.ServeMux, distDir string) bool {
	indexPath := filepath.Join(distDir, "index.html")
	if _, err := os.Stat(indexPath); err != nil {
		return false
	}

	fs := http.Dir(distDir)
	fileServer := http.FileServer(fs)

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Ignore API and health routes
		if strings.HasPrefix(r.URL.Path, "/api/") || r.URL.Path == "/health" {
			http.NotFound(w, r)
			return
		}

		cleanPath := filepath.Clean(r.URL.Path)
		targetFile := filepath.Join(distDir, cleanPath)

		info, err := os.Stat(targetFile)
		// If file doesn't exist or is a directory, serve SPA index.html
		if err != nil || info.IsDir() {
			http.ServeFile(w, r, indexPath)
			return
		}

		fileServer.ServeHTTP(w, r)
	})

	log.Printf("[Server] Serving static SPA frontend from %s", distDir)
	return true
}
