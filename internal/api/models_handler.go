package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
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
		llmURL := "http://localhost:11434"
		if envURL := os.Getenv("LLM_URL"); envURL != "" {
			llmURL = envURL
		}

		var modelsList []modelInfo

		client := &http.Client{Timeout: 3 * time.Second}
		resp, err := client.Get(fmt.Sprintf("%s/api/tags", llmURL))
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

		activeModel := ""
		if a.llmClient != nil {
			activeModel = a.llmClient.GetModel()
		}

		if activeModel == "" && len(modelsList) > 0 {
			activeModel = modelsList[0].Name
			if a.llmClient != nil {
				a.llmClient.SetModel(activeModel)
			}
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
