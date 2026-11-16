package database

import (
	"os"
	"path/filepath"
	"testing"

	"sourcebook/internal/models"
)

func TestSaveChunks_PreservesUnrelatedSources(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "sourcebook_chunks_test_*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	dbPath := filepath.Join(tempDir, "test.db")
	db, err := InitDB(dbPath)
	if err != nil {
		t.Fatalf("InitDB failed: %v", err)
	}
	defer db.Close()

	repo := NewRepository(db)
	nb, err := repo.CreateNotebook("Test Notebook", "Desc")
	if err != nil {
		t.Fatalf("CreateNotebook failed: %v", err)
	}

	src1 := &models.SourceRecord{
		ID:         "source-1",
		NotebookID: nb.ID,
		Title:      "Source 1",
		Content:    "Content 1",
	}
	src2 := &models.SourceRecord{
		ID:         "source-2",
		NotebookID: nb.ID,
		Title:      "Source 2",
		Content:    "Content 2",
	}

	if err := repo.AddSource(src1); err != nil {
		t.Fatalf("AddSource 1 failed: %v", err)
	}
	if err := repo.AddSource(src2); err != nil {
		t.Fatalf("AddSource 2 failed: %v", err)
	}

	// 1. Initial save of chunks for both sources
	initialChunks := []models.DocumentChunk{
		{
			ID:         "chunk-1",
			NotebookID: nb.ID,
			SourceID:   src1.ID,
			ChunkIndex: 0,
			Content:    "Chunk 1 Content",
			Embedding:  []float32{0.1, 0.2, 0.3},
		},
		{
			ID:         "chunk-2",
			NotebookID: nb.ID,
			SourceID:   src2.ID,
			ChunkIndex: 0,
			Content:    "Chunk 2 Content",
			Embedding:  []float32{0.4, 0.5, 0.6},
		},
	}

	if err := repo.SaveChunks(nb.ID, initialChunks); err != nil {
		t.Fatalf("Initial SaveChunks failed: %v", err)
	}

	retrieved, err := repo.GetChunksByNotebook(nb.ID)
	if err != nil {
		t.Fatalf("GetChunksByNotebook failed: %v", err)
	}
	if len(retrieved) != 2 {
		t.Fatalf("Expected 2 chunks, got %d", len(retrieved))
	}

	// 2. Incremental update: save chunks only touching source-1
	updatedChunks := []models.DocumentChunk{
		{
			ID:         "chunk-1-v2",
			NotebookID: nb.ID,
			SourceID:   src1.ID,
			ChunkIndex: 0,
			Content:    "Chunk 1 Updated Content",
			Embedding:  []float32{0.9, 0.9, 0.9},
		},
	}

	if err := repo.SaveChunks(nb.ID, updatedChunks); err != nil {
		t.Fatalf("Incremental SaveChunks failed: %v", err)
	}

	// 3. Verify: source-2 chunks must still exist!
	afterUpdate, err := repo.GetChunksByNotebook(nb.ID)
	if err != nil {
		t.Fatalf("GetChunksByNotebook after update failed: %v", err)
	}

	if len(afterUpdate) != 2 {
		t.Fatalf("Expected 2 chunks (1 updated for source-1, 1 preserved for source-2), got %d", len(afterUpdate))
	}

	source2ChunkFound := false
	source1UpdatedChunkFound := false

	for _, c := range afterUpdate {
		if c.SourceID == src2.ID && c.ID == "chunk-2" {
			source2ChunkFound = true
		}
		if c.SourceID == src1.ID && c.ID == "chunk-1-v2" {
			source1UpdatedChunkFound = true
		}
	}

	if !source2ChunkFound {
		t.Errorf("Chunks for source-2 were incorrectly deleted during source-1 incremental chunk update!")
	}
	if !source1UpdatedChunkFound {
		t.Errorf("Updated chunk for source-1 was not found!")
	}
}
