package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

type llmHealthResponse struct {
	Status     string `json:"status"` // "online" or "offline"
	Model      string `json:"model"`
	Embeddings string `json:"embeddings"`
}

// HandleLLMHealth checks Ollama connectivity and returns status metadata
func (a *API) HandleLLMHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	llmURL := os.Getenv("LLM_URL")
	if llmURL == "" {
		llmURL = "http://localhost:11434"
	}

	model := os.Getenv("LLM_MODEL")
	if model == "" {
		model = "phi4-mini"
	}

	embeddings := os.Getenv("EMBEDDING_MODEL")
	if embeddings == "" {
		embeddings = "nomic-embed-text"
	}

	// Ping Ollama tags endpoint to check if online
	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get(fmt.Sprintf("%s/api/tags", llmURL))

	status := "offline"
	if err == nil && resp.StatusCode == http.StatusOK {
		status = "online"
		resp.Body.Close()
	}

	json.NewEncoder(w).Encode(llmHealthResponse{
		Status:     status,
		Model:      model,
		Embeddings: embeddings,
	})
}
