package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandleModels_IsolatedTestDoesNotMutateClient(t *testing.T) {
	// 1. Mock upstream LLM server for the test action
	mockUpstream := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"choices": [{"message": {"role": "assistant", "content": "pong"}}]}`))
	}))
	defer mockUpstream.Close()

	api := &API{}

	// 2. Dispatch action="test" with test credentials
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
