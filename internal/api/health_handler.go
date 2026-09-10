package api

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"time"
)

type llmHealthResponse struct {
	Status     string `json:"status"` // "online" or "offline"
	Model      string `json:"model"`
	Embeddings string `json:"embeddings"`
}

// HandleLLMHealth checks LLM connectivity dynamically across configured provider (Ollama, OpenAI, Groq, 9router, etc.)
func (a *API) HandleLLMHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	status := "offline"
	model := ""
	if a.llmClient != nil {
		model = a.llmClient.GetModel()
		ctx, cancel := context.WithTimeout(r.Context(), 3*time.Second)
		defer cancel()
		ok, _, err := a.llmClient.TestConnection(ctx)
		if ok && err == nil {
			status = "online"
		}
	}

	if model == "" {
		model = os.Getenv("LLM_MODEL")
	}

	embeddings := os.Getenv("EMBEDDING_MODEL")
	if embeddings == "" {
		embeddings = "all-MiniLM-L6-v2"
	}

	json.NewEncoder(w).Encode(llmHealthResponse{
		Status:     status,
		Model:      model,
		Embeddings: embeddings,
	})
}
