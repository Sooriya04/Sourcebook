package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandlePipeline_MissingQuery(t *testing.T) {
	api, cleanup, err := setupTestAPIWithProvider(&mockSearchProvider{name: "duckduckgo"})
	if err != nil {
		t.Fatalf("Failed to setup test API: %v", err)
	}
	defer cleanup()

	reqBody, _ := json.Marshal(map[string]interface{}{
		"max_sources": 5,
	})
	req := httptest.NewRequest(http.MethodPost, "/api/sourcebook/v1/pipeline", bytes.NewBuffer(reqBody))
	rec := httptest.NewRecorder()

	api.HandlePipeline(rec, req)

	if rec.Code != http.StatusBadRequest {
		t.Errorf("Expected status 400, got %d", rec.Code)
	}
}

func TestHandlePipeline_MethodNotAllowed(t *testing.T) {
	api, cleanup, err := setupTestAPIWithProvider(&mockSearchProvider{name: "duckduckgo"})
	if err != nil {
		t.Fatalf("Failed to setup test API: %v", err)
	}
	defer cleanup()

	req := httptest.NewRequest(http.MethodGet, "/api/sourcebook/v1/pipeline", nil)
	rec := httptest.NewRecorder()

	api.HandlePipeline(rec, req)

	if rec.Code != http.StatusMethodNotAllowed {
		t.Errorf("Expected status 405, got %d", rec.Code)
	}
}
