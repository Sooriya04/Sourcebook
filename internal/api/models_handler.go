package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type modelInfo struct {
	Name        string `json:"name"`
	DisplayName string `json:"display_name"`
}

type modelsResponse struct {
	Models   []modelInfo `json:"models"`
	Active   string      `json:"active"`
	Provider string      `json:"provider"`
	BaseURL  string      `json:"base_url"`
}

type configUpdateRequest struct {
	Provider string `json:"provider"`
	BaseURL  string `json:"base_url"`
	Model    string `json:"model"`
	APIKey   string `json:"api_key"`
	Action   string `json:"action"` // "update" or "test"
}

func (a *API) HandleModels(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodGet {
		provider := "ollama"
		baseURL := "http://localhost:11434"
		activeModel := ""
		apiKey := ""

		if a.llmClient != nil {
			provider, baseURL, activeModel, apiKey = a.llmClient.GetConfig()
		}

		var modelsList []modelInfo

		if provider == "ollama" {
			client := &http.Client{Timeout: 3 * time.Second}
			resp, err := client.Get(fmt.Sprintf("%s/api/tags", baseURL))
			if err == nil && resp.StatusCode == http.StatusOK {
				defer resp.Body.Close()
				var ollamaResp struct {
					Models []struct {
						Name string `json:"name"`
					} `json:"models"`
				}
				if err := json.NewDecoder(resp.Body).Decode(&ollamaResp); err == nil && len(ollamaResp.Models) > 0 {
					for _, m := range ollamaResp.Models {
						modelsList = append(modelsList, modelInfo{
							Name:        m.Name,
							DisplayName: m.Name,
						})
					}
				}
			}
		}

		if activeModel == "" && len(modelsList) > 0 {
			activeModel = modelsList[0].Name
			if a.llmClient != nil {
				a.llmClient.SetModel(activeModel)
			}
		}

		_ = apiKey // keep key secure

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(modelsResponse{
			Models:   modelsList,
			Active:   activeModel,
			Provider: provider,
			BaseURL:  baseURL,
		})
		return
	}

	if r.Method == http.MethodPost {
		var req configUpdateRequest
		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Failed to read request body", http.StatusBadRequest)
			return
		}
		if err := json.Unmarshal(bodyBytes, &req); err != nil {
			http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
			return
		}

		if req.Action == "test" {
			if a.llmClient == nil {
				http.Error(w, "LLM client not initialized", http.StatusInternalServerError)
				return
			}

			// Perform temporary test without mutating saved state permanently if failed
			oldProv, oldURL, oldModel, oldKey := a.llmClient.GetConfig()
			a.llmClient.SetConfig(req.Provider, req.BaseURL, req.Model, req.APIKey)

			ok, sampleRes, testErr := a.llmClient.TestConnection(r.Context())
			if !ok || testErr != nil {
				// Revert on failure
				a.llmClient.SetConfig(oldProv, oldURL, oldModel, oldKey)
				w.Header().Set("Content-Type", "application/json")
				w.WriteHeader(http.StatusBadRequest)
				errDetail := "Connection or API key verification failed"
				if testErr != nil {
					errDetail = testErr.Error()
				}
				json.NewEncoder(w).Encode(map[string]interface{}{
					"valid":   false,
					"error":   errDetail,
					"message": errDetail,
				})
				return
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(map[string]interface{}{
				"valid":   true,
				"sample":  sampleRes,
				"message": fmt.Sprintf("Successfully connected to %s (%s)", req.Model, req.Provider),
			})
			return
		}

		// Regular configuration update
		if a.llmClient != nil {
			a.llmClient.SetConfig(req.Provider, req.BaseURL, req.Model, req.APIKey)
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success":  true,
			"provider": req.Provider,
			"model":    req.Model,
			"base_url": req.BaseURL,
		})
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}
