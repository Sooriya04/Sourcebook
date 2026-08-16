package api

import (
	"encoding/json"
	"io"
	"net/http"
	"time"
)

type modelInfo struct {
	Name        string `json:"name"`
	DisplayName string `json:"display_name"`
}

type modelsResponse struct {
	Models []modelInfo `json:"models"`
	Active string      `json:"active"`
}

type modelsRequest struct {
	Model string `json:"model"`
}

func (a *API) HandleModels(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		// Default fallback models list
		modelsList := []modelInfo{
			{Name: "gemma2", DisplayName: "Gemma 2 (Default)"},
			{Name: "llama3", DisplayName: "Llama 3"},
			{Name: "mistral", DisplayName: "Mistral"},
			{Name: "phi3", DisplayName: "Phi 3"},
		}

		// Try fetching from Ollama if provider is ollama
		if a.llmClient != nil {
			client := &http.Client{Timeout: 3 * time.Second}
			resp, err := client.Get("http://localhost:11434/api/tags")
			if err == nil && resp.StatusCode == http.StatusOK {
				defer resp.Body.Close()
				var ollamaResp struct {
					Models []struct {
						Name string `json:"name"`
					} `json:"models"`
				}
				if err := json.NewDecoder(resp.Body).Decode(&ollamaResp); err == nil && len(ollamaResp.Models) > 0 {
					var fetchedModels []modelInfo
					for _, m := range ollamaResp.Models {
						fetchedModels = append(fetchedModels, modelInfo{
							Name:        m.Name,
							DisplayName: m.Name,
						})
					}
					modelsList = fetchedModels
				}
			}
		}

		activeModel := ""
		if a.llmClient != nil {
			activeModel = a.llmClient.GetModel()
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(modelsResponse{
			Models: modelsList,
			Active: activeModel,
		})
		return
	}

	if r.Method == http.MethodPost {
		var req modelsRequest
		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Failed to read request body", http.StatusBadRequest)
			return
		}
		if err := json.Unmarshal(bodyBytes, &req); err != nil {
			http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
			return
		}

		if req.Model == "" {
			http.Error(w, "Model field is required", http.StatusBadRequest)
			return
		}

		if a.llmClient != nil {
			a.llmClient.SetModel(req.Model)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"model":   req.Model,
		})
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}
