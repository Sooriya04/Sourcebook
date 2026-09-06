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

	model := ""
	if a.llmClient != nil {
		model = a.llmClient.GetModel()
	}
	if model == "" {
		model = os.Getenv("LLM_MODEL")
	}

	embeddings := os.Getenv("EMBEDDING_MODEL")
	if embeddings == "" {
		embeddings = "nomic-embed-text"
	}

	// Ping Ollama tags endpoint to check status and installed models
	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Get(fmt.Sprintf("%s/api/tags", llmURL))

	status := "offline"
	if err == nil && resp.StatusCode == http.StatusOK {
		status = "online"
		defer resp.Body.Close()

		var ollamaResp struct {
			Models []struct {
				Name string `json:"name"`
			} `json:"models"`
		}

		if err := json.NewDecoder(resp.Body).Decode(&ollamaResp); err == nil && len(ollamaResp.Models) > 0 {
			found := false
			for _, m := range ollamaResp.Models {
				if m.Name == model {
					found = true
					break
				}
			}
			// Auto-fallback to the first installed Ollama model if configured model is missing
			if !found {
				model = ollamaResp.Models[0].Name
				if a.llmClient != nil {
					a.llmClient.SetModel(model)
				}
			}
		}
	}

	json.NewEncoder(w).Encode(llmHealthResponse{
		Status:     status,
		Model:      model,
		Embeddings: embeddings,
	})
}
