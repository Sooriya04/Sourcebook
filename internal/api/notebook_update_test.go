package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"sync/atomic"
	"testing"
	"time"

	"sourcebook/internal/database"
	"sourcebook/internal/models"
)

func TestHandleNotebookUpdate_DecoupledAgenticSearch(t *testing.T) {
	// Mock slow search service planner to verify handleNotebookUpdate does not block
	var plannerCalls int32
	mockSearchServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&plannerCalls, 1)
		// Simulate heavy 200ms processing
		time.Sleep(200 * time.Millisecond)
		w.Header().Set("Content-Type", "application/json")
		resp := map[string]interface{}{
			"plan": map[string]interface{}{
				"intent": "research",
				"queries": []map[string]string{
					{"query": "quantum computing basics", "provider": "searxng"},
				},
			},
		}
		json.NewEncoder(w).Encode(resp)
	}))
	defer mockSearchServer.Close()

	origSearchURL := os.Getenv("SEARCH_SERVICE_URL")
	defer os.Setenv("SEARCH_SERVICE_URL", origSearchURL)
	os.Setenv("SEARCH_SERVICE_URL", mockSearchServer.URL)

	db, err := database.InitDB(":memory:")
	if err != nil {
		t.Fatalf("InitDB failed: %v", err)
	}
	defer db.Close()
	repo := database.NewRepository(db)

	nb, err := repo.CreateNotebook("Async Ingestion Test", "Verifying non-blocking notebook update")
	if err != nil {
		t.Fatalf("CreateNotebook failed: %v", err)
	}

	api := &API{
		repo: repo,
	}

	// Payload with a text source > 50 chars which triggers agentic enrichment
	longContent := "Quantum computing is a rapidly-emerging technology that harnesses the laws of quantum mechanics to solve problems too complex for classical computers."
	reqBody, _ := json.Marshal(updateNotebookRequest{
		Title: "Async Ingestion Test Updated",
		Sources: []models.SourceRecord{
			{
				Title:   "Quantum Intro",
				Type:    "text",
				Content: longContent,
			},
		},
	})

	req := httptest.NewRequest(http.MethodPut, "/api/sourcebook/v1/notebooks/"+nb.ID, bytes.NewReader(reqBody))
	w := httptest.NewRecorder()

	start := time.Now()
	api.handleNotebookUpdate(w, req, nb.ID)
	elapsed := time.Since(start)

	// HTTP request should complete almost immediately (< 100ms) rather than waiting for planner sleep (200ms)
	if elapsed > 150*time.Millisecond {
		t.Fatalf("handleNotebookUpdate took %v, expected non-blocking completion under 150ms", elapsed)
	}

	if w.Code != http.StatusNoContent {
		t.Fatalf("Expected status 204 No Content, got %d: %s", w.Code, w.Body.String())
	}

	// Verify notebook was immediately updated in SQLite
	updatedNB, err := repo.GetNotebook(nb.ID)
	if err != nil {
		t.Fatalf("GetNotebook failed: %v", err)
	}
	if updatedNB.Title != "Async Ingestion Test Updated" {
		t.Errorf("Notebook title was not updated immediately: %s", updatedNB.Title)
	}

	// Wait up to 1 second for the background enrichment goroutine to trigger planner
	deadline := time.Now().Add(1 * time.Second)
	var called bool
	for time.Now().Before(deadline) {
		if atomic.LoadInt32(&plannerCalls) > 0 {
			called = true
			break
		}
		time.Sleep(20 * time.Millisecond)
	}

	if !called {
		t.Errorf("Expected background agentic planner to be triggered asynchronously")
	}
}
