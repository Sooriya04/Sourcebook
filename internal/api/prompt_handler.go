package api

import (
	"encoding/json"
	"net/http"
	"strings"

	"sourcebook/internal/database"
)

// HandlePrompts handles GET/POST /api/sourcebook/v1/prompts and PUT/DELETE /api/sourcebook/v1/prompts/{id}.
func (a *API) HandlePrompts(w http.ResponseWriter, r *http.Request) {
	if a.repo == nil {
		http.Error(w, "Database repository unavailable", http.StatusServiceUnavailable)
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/sourcebook/v1/prompts")
	promptID := strings.Trim(path, "/")

	switch r.Method {
	case http.MethodGet:
		prompts, err := a.repo.ListCustomPrompts()
		if err != nil {
			http.Error(w, "Failed to list prompts", http.StatusInternalServerError)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"prompts": prompts})

	case http.MethodPost, http.MethodPut:
		var req database.CustomPrompt
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
			return
		}
		if strings.TrimSpace(req.Instructions) == "" {
			http.Error(w, "Instructions are required", http.StatusBadRequest)
			return
		}
		if promptID != "" {
			req.ID = promptID
		}
		saved, err := a.repo.SaveCustomPrompt(req)
		if err != nil {
			http.Error(w, "Failed to save prompt", http.StatusInternalServerError)
			return
		}
		writeJSON(w, http.StatusOK, saved)

	case http.MethodDelete:
		if promptID == "" {
			http.Error(w, "Prompt ID is required", http.StatusBadRequest)
			return
		}
		if err := a.repo.DeleteCustomPrompt(promptID); err != nil {
			http.Error(w, "Failed to delete prompt", http.StatusInternalServerError)
			return
		}
		writeJSON(w, http.StatusOK, map[string]bool{"ok": true})

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

// HandlePromptHistory handles GET/POST /api/sourcebook/v1/prompts/history and PATCH /api/sourcebook/v1/prompts/history/{id}.
func (a *API) HandlePromptHistory(w http.ResponseWriter, r *http.Request) {
	if a.repo == nil {
		http.Error(w, "Database repository unavailable", http.StatusServiceUnavailable)
		return
	}

	path := strings.TrimPrefix(r.URL.Path, "/api/sourcebook/v1/prompts/history")
	runID := strings.Trim(path, "/")

	switch r.Method {
	case http.MethodGet:
		list, err := a.repo.ListPromptExecutions(50)
		if err != nil {
			http.Error(w, "Failed to list prompt history", http.StatusInternalServerError)
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"history": list})

	case http.MethodPost:
		var req database.PromptExecution
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
			return
		}
		if strings.TrimSpace(req.Instructions) == "" {
			http.Error(w, "Instructions are required", http.StatusBadRequest)
			return
		}
		saved, err := a.repo.RecordPromptExecution(req)
		if err != nil {
			http.Error(w, "Failed to record prompt execution", http.StatusInternalServerError)
			return
		}
		writeJSON(w, http.StatusOK, saved)

	case http.MethodPatch:
		if runID == "" {
			http.Error(w, "Execution ID is required", http.StatusBadRequest)
			return
		}
		var body struct {
			Status string `json:"status"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil || strings.TrimSpace(body.Status) == "" {
			http.Error(w, "Valid status is required", http.StatusBadRequest)
			return
		}
		if err := a.repo.UpdatePromptExecutionStatus(runID, body.Status); err != nil {
			http.Error(w, "Failed to update execution status", http.StatusInternalServerError)
			return
		}
		writeJSON(w, http.StatusOK, map[string]bool{"ok": true})

	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func writeJSON(w http.ResponseWriter, status int, data any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(data)
}
