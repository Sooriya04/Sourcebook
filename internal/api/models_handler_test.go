package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"sourcebook/internal/database"
	"sourcebook/internal/llm"
)

func TestHandleModels_IsolatedTestDoesNotMutateClient(t *testing.T) {
	mockUpstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"choices": [{"message": {"role": "assistant", "content": "pong"}}]}`))
	}))
	defer mockUpstream.Close()

	api := &API{}

	reqPayload, _ := json.Marshal(map[string]interface{}{
		"provider": "openai",
		"base_url": mockUpstream.URL,
		"model":    "test-model",
		"api_key":  "test-key",
		"action":   "test",
	})

	req := httptest.NewRequest(http.MethodPost, "/api/sourcebook/v1/models", bytes.NewBuffer(reqPayload))
	w := httptest.NewRecorder()

	api.HandleModels(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to decode response: %v", err)
	}
	if resp["valid"] != true {
		t.Fatalf("Expected valid=true, got %v", resp["valid"])
	}
}

func TestHandleModels_UpdateAndPersistProvider(t *testing.T) {
	db, err := database.InitDB(":memory:")
	if err != nil {
		t.Fatalf("Failed to init db: %v", err)
	}
	defer db.Close()
	repo := database.NewRepository(db)
	llmClient := llm.NewClient()

	api := &API{
		repo:      repo,
		llmClient: llmClient,
	}

	// 1. Update config to Groq
	reqPayload, _ := json.Marshal(map[string]interface{}{
		"provider": "groq",
		"base_url": "",
		"model":    "llama-3.3-70b-versatile",
		"api_key":  "gsk_test123",
		"action":   "update",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/sourcebook/v1/models", bytes.NewBuffer(reqPayload))
	w := httptest.NewRecorder()
	api.HandleModels(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	// Verify llmClient is updated
	p, u, m, k := llmClient.GetConfig()
	if p != "groq" {
		t.Errorf("Expected llmClient provider 'groq', got %q", p)
	}
	if u != llm.DefaultBaseURL("groq") {
		t.Errorf("Expected llmClient baseURL %q, got %q", llm.DefaultBaseURL("groq"), u)
	}
	if m != "llama-3.3-70b-versatile" {
		t.Errorf("Expected model 'llama-3.3-70b-versatile', got %q", m)
	}
	if k != "gsk_test123" {
		t.Errorf("Expected apiKey 'gsk_test123', got %q", k)
	}

	// Verify repo is updated
	s, err := repo.GetSettings()
	if err != nil {
		t.Fatalf("Failed to get settings: %v", err)
	}
	if s.LLMProvider != "groq" {
		t.Errorf("Expected repo provider 'groq', got %q", s.LLMProvider)
	}

	// 2. Fetch models via GET and verify it reports groq
	getReq := httptest.NewRequest(http.MethodGet, "/api/sourcebook/v1/models", nil)
	getW := httptest.NewRecorder()
	api.HandleModels(getW, getReq)

	var getResp modelsResponse
	if err := json.Unmarshal(getW.Body.Bytes(), &getResp); err != nil {
		t.Fatalf("Failed to unmarshal GET models: %v", err)
	}
	if getResp.Provider != "groq" {
		t.Errorf("Expected GET provider 'groq', got %q", getResp.Provider)
	}
	if getResp.Active != "llama-3.3-70b-versatile" {
		t.Errorf("Expected GET active model 'llama-3.3-70b-versatile', got %q", getResp.Active)
	}
}
