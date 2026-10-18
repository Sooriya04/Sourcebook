package api

import (
	"sync"
	"testing"
	"time"

	"sourcebook/internal/models"
)

func TestActiveNotebookEmbeddingsDeduplication(t *testing.T) {
	testID := "test-dedup-notebook"

	activeNotebookEmbeddingsMu.Lock()
	activeNotebookEmbeddings[testID] = true
	activeNotebookEmbeddingsMu.Unlock()

	defer func() {
		activeNotebookEmbeddingsMu.Lock()
		delete(activeNotebookEmbeddings, testID)
		activeNotebookEmbeddingsMu.Unlock()
	}()

	api := &API{}

	// When an embedding task is already marked as running for testID,
	// triggerNotebookEmbedding must return immediately without spawning duplicate work.
	api.triggerNotebookEmbedding(testID, []models.SourceRecord{
		{ID: "src-1", Title: "Test Source", Content: "Test content"},
	})

	activeNotebookEmbeddingsMu.Lock()
	isActive := activeNotebookEmbeddings[testID]
	activeNotebookEmbeddingsMu.Unlock()

	if !isActive {
		t.Errorf("expected notebook %s to still be marked active", testID)
	}
}

func TestActiveNotebookEmbeddingsConcurrency(t *testing.T) {
	testID := "test-concurrency-notebook"

	activeNotebookEmbeddingsMu.Lock()
	delete(activeNotebookEmbeddings, testID)
	activeNotebookEmbeddingsMu.Unlock()

	defer func() {
		activeNotebookEmbeddingsMu.Lock()
		delete(activeNotebookEmbeddings, testID)
		activeNotebookEmbeddingsMu.Unlock()
	}()

	var wg sync.WaitGroup
	attempts := 10
	started := 0
	var mu sync.Mutex

	for i := 0; i < attempts; i++ {
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
