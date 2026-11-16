package api

import (
	"context"
	"log"
	"strings"
	"sync"
	"time"

	"sourcebook/internal/models"

	"github.com/google/uuid"
)

var (
	activeNotebookEmbeddingsMu sync.Mutex
	activeNotebookEmbeddings   = make(map[string]bool)
	pendingNotebookEmbeddings  = make(map[string]bool)
)

// triggerNotebookEmbedding initiates background chunking and embedding for notebook sources.
// If an embedding task is already running for notebookID, it queues the notebook as pending so new sources are not dropped.
func (a *API) triggerNotebookEmbedding(notebookID string, sources []models.SourceRecord) {
	activeNotebookEmbeddingsMu.Lock()
	if activeNotebookEmbeddings[notebookID] {
		pendingNotebookEmbeddings[notebookID] = true
		activeNotebookEmbeddingsMu.Unlock()
		log.Printf("[Embeddings] Task already active for notebook %s; queued pending run", notebookID)
		return
	}
	activeNotebookEmbeddings[notebookID] = true
	activeNotebookEmbeddingsMu.Unlock()

	go a.processNotebookEmbeddings(notebookID, sources)
}

func (a *API) processNotebookEmbeddings(notebookID string, initialSources []models.SourceRecord) {
	defer func() {
		activeNotebookEmbeddingsMu.Lock()
		delete(activeNotebookEmbeddings, notebookID)
		delete(pendingNotebookEmbeddings, notebookID)
		activeNotebookEmbeddingsMu.Unlock()
	}()

	if a.vectorClient == nil {
		log.Printf("[Embeddings] Vector client not initialized; skipping embedding for notebook %s", notebookID)
		return
	}

	sources := initialSources
	for {
		a.embedSources(notebookID, sources)

		activeNotebookEmbeddingsMu.Lock()
		if !pendingNotebookEmbeddings[notebookID] {
			delete(activeNotebookEmbeddings, notebookID)
			activeNotebookEmbeddingsMu.Unlock()
			break
		}
		delete(pendingNotebookEmbeddings, notebookID)
		activeNotebookEmbeddingsMu.Unlock()

		if a.repo != nil {
			latest, err := a.repo.GetSourcesByNotebook(notebookID)
			if err != nil {
				log.Printf("[Embeddings] Error querying sources for notebook %s: %v", notebookID, err)
				activeNotebookEmbeddingsMu.Lock()
				delete(activeNotebookEmbeddings, notebookID)
				activeNotebookEmbeddingsMu.Unlock()
				break
			}
			sources = latest
		}
	}
}

func (a *API) embedSources(notebookID string, sources []models.SourceRecord) {
	if a.repo == nil {
		return
	}

	bgCtx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
	defer cancel()

	log.Printf("[Embeddings] Worker started for notebook %s (%d sources)", notebookID, len(sources))

	// Re-query existing chunks from the database
	existingChunks, err := a.repo.GetChunksByNotebook(notebookID)
	if err != nil {
		log.Printf("[Embeddings] Error querying existing chunks for notebook %s: %v", notebookID, err)
		return
	}

	chunksBySource := make(map[string][]models.DocumentChunk)
	for _, ch := range existingChunks {
		chunksBySource[ch.SourceID] = append(chunksBySource[ch.SourceID], ch)
	}

	var allChunks []models.DocumentChunk
	newChunksGenerated := 0

	for _, src := range sources {
		if strings.TrimSpace(src.Content) == "" {
			continue
		}

		// If a source already has chunks, skip embedding!
		if existing, ok := chunksBySource[src.ID]; ok && len(existing) > 0 {
			allChunks = append(allChunks, existing...)
			continue
		}

		log.Printf("[Embeddings] Generating embeddings for new source: %q (id=%s)...", src.Title, src.ID)
		pythonChunks, err := a.vectorClient.GenerateEmbeddings(bgCtx, src.Content)
		if err != nil {
			log.Printf("[Embeddings] Failed to generate embeddings for source %s: %v", src.ID, err)
			continue
		}

		log.Printf("[Embeddings] Generated %d chunks for source %q", len(pythonChunks), src.Title)
		for i, pc := range pythonChunks {
			allChunks = append(allChunks, models.DocumentChunk{
				ID:         uuid.NewString(),
				NotebookID: notebookID,
				SourceID:   src.ID,
				ChunkIndex: i,
				Content:    pc.Chunk,
				Embedding:  pc.Embedding,
			})
			newChunksGenerated++
		}
	}

	if newChunksGenerated > 0 || len(allChunks) != len(existingChunks) {
		if len(allChunks) > 0 {
			if err := a.repo.SaveChunks(notebookID, allChunks); err != nil {
				log.Printf("[Embeddings] Failed to save %d chunks for notebook %s: %v", len(allChunks), notebookID, err)
			} else {
				log.Printf("[Embeddings] Successfully saved %d chunks (%d new) for notebook %s", len(allChunks), newChunksGenerated, notebookID)
			}
		}
	} else {
		log.Printf("[Embeddings] Notebook %s embeddings up to date (%d chunks)", notebookID, len(allChunks))
	}
}
