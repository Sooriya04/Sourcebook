package api

import (
	"context"
	"encoding/json"
	"net/http"
	"os"
	"sync"
	"time"
)

type llmHealthResponse struct {
	Status     string `json:"status"` // "online" or "offline"
	Model      string `json:"model"`
	Embeddings string `json:"embeddings"`
}

var (
	healthMu        sync.Mutex
	cachedHealth    llmHealthResponse
	lastHealthCheck time.Time
)

// InvalidateHealthCache resets the cached LLM status so subsequent checks re-verify immediately.
func InvalidateHealthCache() {
	healthMu.Lock()
	cachedHealth = llmHealthResponse{}
	lastHealthCheck = time.Time{}
	healthMu.Unlock()
}

// HandleLLMHealth checks LLM connectivity dynamically across configured provider (Ollama, OpenAI, Groq, etc.)
func (a *API) HandleLLMHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")

	healthMu.Lock()
	// Cache "online" for 30s, but recheck "offline" much faster (3s) so status recovers promptly
	cacheDuration := 30 * time.Second
	if cachedHealth.Status == "offline" {
		cacheDuration = 3 * time.Second
	}
	if time.Since(lastHealthCheck) < cacheDuration && cachedHealth.Status != "" {
		res := cachedHealth
		healthMu.Unlock()
		json.NewEncoder(w).Encode(res)
		return
	}
	healthMu.Unlock()

	status := "offline"
	model := ""
	if a.llmClient != nil {
		model = a.llmClient.GetModel()
		ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
		defer cancel()
		ok, err := a.llmClient.Ping(ctx)
		if ok && err == nil {
			status = "online"
		}
	}

	if model == "" {
		if a.repo != nil {
			if s, err := a.repo.GetSettings(); err == nil && s.LLMModel != "" {
				model = s.LLMModel
			}
		}
		if model == "" {
			model = os.Getenv("LLM_MODEL")
		}
	}

	embeddings := ""
	if a.repo != nil {
		if s, err := a.repo.GetSettings(); err == nil && s.EmbeddingModel != "" {
			embeddings = s.EmbeddingModel
		}
	}
	if embeddings == "" {
		embeddings = os.Getenv("EMBEDDING_MODEL")
	}
	if embeddings == "" {
		embeddings = "all-MiniLM-L6-v2"
	}

	res := llmHealthResponse{
		Status:     status,
		Model:      model,
		Embeddings: embeddings,
	}

	healthMu.Lock()
	cachedHealth = res
	lastHealthCheck = time.Now()
	healthMu.Unlock()

	json.NewEncoder(w).Encode(res)
}
