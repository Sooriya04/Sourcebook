package api

import (
	"encoding/json"
	"net/http"
)

// HandleSentinelStatus returns the status of the background sentinel agent.
func (a *API) HandleSentinelStatus(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	running := a.sentinel.Running()
	emptyCount := a.sentinel.EmptyCount()

	if emptyCount > 0 && !running {
		a.sentinel.Trigger()
		running = true
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"running":     running,
		"empty_count": emptyCount,
	})
}
