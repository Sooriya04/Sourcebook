package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"

	"sourcebook/internal/database"
	"sourcebook/internal/models"
	"sourcebook/internal/vector"
)

func TestActiveNotebookEmbeddingsDeduplication(t *testing.T) {
	testID := "test-dedup-notebook"
	activeNotebookEmbeddingsMu.Lock()
	activeNotebookEmbeddings[testID] = true
	activeNotebookEmbeddingsMu.Unlock()
	defer func() {
		activeNotebookEmbeddingsMu.Lock()
		delete(activeNotebookEmbeddings, testID)
		delete(pendingNotebookEmbeddings, testID)
		activeNotebookEmbeddingsMu.Unlock()
	}()

	api := &API{}
	api.triggerNotebookEmbedding(testID, []models.SourceRecord{
		{ID: "src-1", Title: "Test Source", Content: "Test content"},
	})

	activeNotebookEmbeddingsMu.Lock()
	isActive := activeNotebookEmbeddings[testID]
	isPending := pendingNotebookEmbeddings[testID]
	activeNotebookEmbeddingsMu.Unlock()

	if !isActive || !isPending {
		t.Errorf("expected active=true and pending=true, got active=%v pending=%v", isActive, isPending)
	}
}

func TestActiveNotebookEmbeddingsConcurrency(t *testing.T) {
	testID := "test-concurrency-notebook"
	activeNotebookEmbeddingsMu.Lock()
	delete(activeNotebookEmbeddings, testID)
	delete(pendingNotebookEmbeddings, testID)
	activeNotebookEmbeddingsMu.Unlock()
	defer func() {
		activeNotebookEmbeddingsMu.Lock()
		delete(activeNotebookEmbeddings, testID)
		delete(pendingNotebookEmbeddings, testID)
		activeNotebookEmbeddingsMu.Unlock()
	}()

	var wg sync.WaitGroup
	started := 0
	var mu sync.Mutex

	for i := 0; i < 10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			activeNotebookEmbeddingsMu.Lock()
			if activeNotebookEmbeddings[testID] {
				activeNotebookEmbeddingsMu.Unlock()
				return
			}
			activeNotebookEmbeddings[testID] = true
			activeNotebookEmbeddingsMu.Unlock()

			mu.Lock()
			started++
			mu.Unlock()

			time.Sleep(10 * time.Millisecond)
			activeNotebookEmbeddingsMu.Lock()
			delete(activeNotebookEmbeddings, testID)
			activeNotebookEmbeddingsMu.Unlock()
		}()
	}
	wg.Wait()

	mu.Lock()
	count := started
	mu.Unlock()
	if count == 0 {
		t.Errorf("expected at least 1 task to start")
	}
}

func TestProcessNotebookEmbeddings_LoopsPendingSources(t *testing.T) {
	db, err := database.InitDB(":memory:")
	if err != nil {
		t.Fatalf("InitDB failed: %v", err)
	}
	defer db.Close()
	repo := database.NewRepository(db)

	nb, err := repo.CreateNotebook("Embed Test", "Testing pending loop")
	if err != nil {
		t.Fatalf("CreateNotebook failed: %v", err)
	}

	mockEmbedServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			Texts []string `json:"texts"`
		}
		json.NewDecoder(r.Body).Decode(&req)
		embeddings := make([][]float32, len(req.Texts))
		for i := range req.Texts {
			embeddings[i] = []float32{0.1, 0.2, 0.3}
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{"embeddings": embeddings, "dimension": 3})
	}))
	defer mockEmbedServer.Close()

	vc := vector.NewClient()
	vc.SetConfig(mockEmbedServer.URL, "test-model")
	api := &API{repo: repo, vectorClient: vc}

	src1 := models.SourceRecord{ID: "src-1", NotebookID: nb.ID, Title: "Source 1", Content: "First source content."}
	if err := repo.AddSource(&src1); err != nil {
		t.Fatalf("AddSource 1 failed: %v", err)
	}
	api.triggerNotebookEmbedding(nb.ID, []models.SourceRecord{src1})

	src2 := models.SourceRecord{ID: "src-2", NotebookID: nb.ID, Title: "Source 2", Content: "Second source added quickly."}
	if err := repo.AddSource(&src2); err != nil {
		t.Fatalf("AddSource 2 failed: %v", err)
	}
	api.triggerNotebookEmbedding(nb.ID, []models.SourceRecord{src2})

	deadline := time.Now().Add(3 * time.Second)
	for time.Now().Before(deadline) {
		activeNotebookEmbeddingsMu.Lock()
		done := !activeNotebookEmbeddings[nb.ID] && !pendingNotebookEmbeddings[nb.ID]
		activeNotebookEmbeddingsMu.Unlock()
		if done {
			break
		}
		time.Sleep(20 * time.Millisecond)
	}

	chunks, err := repo.GetChunksByNotebook(nb.ID)
	if err != nil {
		t.Fatalf("GetChunksByNotebook failed: %v", err)
	}
	hasSrc1, hasSrc2 := false, false
	for _, ch := range chunks {
		if ch.SourceID == "src-1" {
			hasSrc1 = true
		}
		if ch.SourceID == "src-2" {
			hasSrc2 = true
		}
	}
	if !hasSrc1 || !hasSrc2 {
		t.Errorf("expected chunks for both sources, got src1=%v, src2=%v (%d total)", hasSrc1, hasSrc2, len(chunks))
	}
}
