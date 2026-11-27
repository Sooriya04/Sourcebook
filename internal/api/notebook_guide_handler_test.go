package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"sourcebook/internal/database"
	"sourcebook/internal/llm"
	"sourcebook/internal/models"
	"sourcebook/internal/synthesis"
)

func TestHandleNotebookGuide_FallbackNotCachedOnFailure(t *testing.T) {
	db, err := database.InitDB(":memory:")
	if err != nil {
		t.Fatalf("InitDB failed: %v", err)
	}
	defer db.Close()
	repo := database.NewRepository(db)

	nb, err := repo.CreateNotebook("Guide Test", "Testing Guide")
	if err != nil {
		t.Fatalf("CreateNotebook failed: %v", err)
	}

	if err := repo.AddSource(&models.SourceRecord{
		ID:         "src-1",
		NotebookID: nb.ID,
		Title:      "Quantum Computing",
		Content:    "Intro to qubits.",
	}); err != nil {
		t.Fatalf("AddSource failed: %v", err)
	}

	// Mock server that returns invalid JSON / 500 error
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "LLM unavailable", http.StatusInternalServerError)
	}))
	defer mockServer.Close()

	llmClient := llm.NewClient()
	llmClient.SetConfig("openai", mockServer.URL, "gpt-4o", "test-key")

	api := &API{
		repo:        repo,
		synthesizer: synthesis.NewSynthesizer(llmClient),
	}

	req := httptest.NewRequest(http.MethodGet, "/api/sourcebook/v1/notebooks/"+nb.ID+"/guide", nil)
	w := httptest.NewRecorder()

	api.HandleNotebookGuide(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("Expected 200 OK, got %d", w.Code)
	}

	var resp models.NotebookGuide
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("Failed to parse response: %v", err)
	}

	if resp.Summary == "" {
		t.Fatal("Expected fallback summary in response, got empty")
	}

	// Verify that the fallback guide was NOT persisted in SQLite
	cached, err := repo.GetNotebookGuide(nb.ID)
	if err == nil && cached != nil && cached.Summary != "" {
		t.Fatalf("Expected fallback guide NOT to be cached in DB, but found: %+v", cached)
	}
}
