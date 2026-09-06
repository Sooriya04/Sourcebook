package api

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"sourcebook/internal/chat"
)

// HandleChat handles user questions, executes semantic notebook search or web search, and synthesizes a grounded response.
func (a *API) HandleChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req chat.ChatRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Query == "" {
		http.Error(w, "Query parameter 'query' is required", http.StatusBadRequest)
		return
	}

	log.Printf("[Chat] Mode: %s, Notebook: %s, Query: %q", req.Mode, req.NotebookID, req.Query)

	res, err := a.chatController.Generate(r.Context(), req)
	if err != nil {
		log.Printf("[Chat] Error: %v", err)
		errStr := err.Error()
		errMsg := "An unexpected error occurred during synthesis."

		activeModel := "the configured LLM"
		if a.llmClient != nil && a.llmClient.GetModel() != "" {
			activeModel = a.llmClient.GetModel()
		}

		if strings.Contains(strings.ToLower(errStr), "connection refused") || strings.Contains(strings.ToLower(errStr), "reach ollama") {
			errMsg = "SourceBook cannot connect to the LLM right now."
		} else if strings.Contains(strings.ToLower(errStr), "model") || strings.Contains(strings.ToLower(errStr), "not found") {
			errMsg = activeModel + " is not available on the configured Ollama server."
		}

		http.Error(w, errMsg, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(res)
}
