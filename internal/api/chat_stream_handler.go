package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strings"
	"sourcebook/internal/chat"
	"sourcebook/internal/models"
)

type chatStreamChunk struct {
	Token      string                      `json:"token,omitempty"`
	Sources    []chat.SourceCitationDetail `json:"sources,omitempty"`
	Context    string                      `json:"context,omitempty"`
	NewSources []models.SourceRecord       `json:"new_sources,omitempty"`
	Status     string                      `json:"status,omitempty"`
	Error      string                      `json:"error,omitempty"`
}

// HandleChatStream handles user questions and streams tokens via Server-Sent Events (SSE)
func (a *API) HandleChatStream(w http.ResponseWriter, r *http.Request) {
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

	// Setup SSE headers
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	sendChunk := func(chunk chatStreamChunk) error {
		bytes, err := json.Marshal(chunk)
		if err != nil {
			return err
		}
		_, err = fmt.Fprintf(w, "data: %s\n\n", string(bytes))
		if err != nil {
			return err
		}
		flusher.Flush()
		return nil
	}

	log.Printf("[ChatStream] Mode: %s, Notebook: %s, Query: %q", req.Mode, req.NotebookID, req.Query)

	// Callback for real-time status updates from the agent
	onStatus := func(status string) {
		_ = sendChunk(chatStreamChunk{Status: status})
	}

	// Call chat controller stream synthesis
	citations, newSources, contextMeta, err := a.chatController.GenerateStream(r.Context(), req, func(token string) error {
		return sendChunk(chatStreamChunk{Token: token})
	}, onStatus)

	if err != nil {
		log.Printf("[ChatStream] Stream error: %v", err)
		errMsg := "An unexpected error occurred during synthesis."
		errStr := err.Error()

		activeModel := "the configured LLM"
		if a.llmClient != nil && a.llmClient.GetModel() != "" {
			activeModel = a.llmClient.GetModel()
		}

		if r.Context().Err() != nil {
			// Client cancelled the request
			log.Printf("[ChatStream] Client disconnected / aborted stream.")
			return
		} else if strings.Contains(strings.ToLower(errStr), "connection refused") || strings.Contains(strings.ToLower(errStr), "reach ollama") {
			errMsg = "SourceBook cannot connect to the LLM right now."
		} else if strings.Contains(strings.ToLower(errStr), "model") || strings.Contains(strings.ToLower(errStr), "not found") {
			errMsg = activeModel + " is not available on the configured Ollama server."
		}

		_ = sendChunk(chatStreamChunk{Error: errMsg})
		return
	}

	// Send final metadata (citations and retrieved source context info)
	_ = sendChunk(chatStreamChunk{
		Sources:    citations,
		NewSources: newSources,
		Context:    contextMeta,
	})
}
