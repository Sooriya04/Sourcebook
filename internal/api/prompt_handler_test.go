package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"testing"

	"sourcebook/internal/database"
)

func TestHandlePromptsAndHistory(t *testing.T) {
	db, err := database.InitDB(filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatalf("InitDB failed: %v", err)
	}
	defer db.Close()

	a := NewAPI(nil, nil, nil, database.NewRepository(db))

	// Create prompt
	body := bytes.NewBufferString(`{"name":"Gap Check","instructions":"Find 3 gaps","executionMode":"custom_priority"}`)
	req := httptest.NewRequest(http.MethodPost, "/api/sourcebook/v1/prompts", body)
	rec := httptest.NewRecorder()
	a.HandlePrompts(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 on POST prompt, got %d: %s", rec.Code, rec.Body.String())
	}

	var created database.CustomPrompt
	_ = json.Unmarshal(rec.Body.Bytes(), &created)
	if created.ID == "" {
		t.Fatal("expected created prompt ID")
	}

	// List prompts
	req = httptest.NewRequest(http.MethodGet, "/api/sourcebook/v1/prompts", nil)
	rec = httptest.NewRecorder()
	a.HandlePrompts(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 on GET prompts, got %d", rec.Code)
	}

	// Delete prompt
	req = httptest.NewRequest(http.MethodDelete, "/api/sourcebook/v1/prompts/"+created.ID, nil)
	rec = httptest.NewRecorder()
	a.HandlePrompts(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 on DELETE prompt, got %d", rec.Code)
	}

	// Record history
	hBody := bytes.NewBufferString(`{"notebookId":"nb1","promptName":"Gap Check","instructions":"Find 3 gaps","sourceMode":"all","sourceCount":2,"status":"running"}`)
	req = httptest.NewRequest(http.MethodPost, "/api/sourcebook/v1/prompts/history", hBody)
	rec = httptest.NewRecorder()
	a.HandlePromptHistory(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 on POST history, got %d", rec.Code)
	}
	var run database.PromptExecution
	_ = json.Unmarshal(rec.Body.Bytes(), &run)

	// Patch status
	pBody := bytes.NewBufferString(`{"status":"completed"}`)
	req = httptest.NewRequest(http.MethodPatch, "/api/sourcebook/v1/prompts/history/"+run.ID, pBody)
	rec = httptest.NewRecorder()
	a.HandlePromptHistory(rec, req)
	if rec.Code != http.StatusOK {
		t.Fatalf("expected 200 on PATCH history, got %d", rec.Code)
	}
}
