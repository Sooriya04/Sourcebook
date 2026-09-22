package api

import (
	"encoding/json"
	"net/http"
)

// HandleSentinelStatus returns the status of the background sentinel agent,
// optionally scoped to a specific notebook if notebook_id is provided.
// Supports POST to trigger an explicit repair cycle when empty sources exist.
func (a *API) HandleSentinelStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet && r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	notebookID := r.URL.Query().Get("notebook_id")
	emptyCount := a.sentinel.EmptyCount(notebookID)
	totalCount := a.sentinel.TotalCount(notebookID)
	running := a.sentinel.Running()

	if r.Method == http.MethodPost && emptyCount > 0 && !running {
		a.sentinel.Trigger()
		running = true
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"running":     running && emptyCount > 0,
		"empty_count": emptyCount,
		"total_count": totalCount,
	})
}
