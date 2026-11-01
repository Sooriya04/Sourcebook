package database

import (
	"os"
	"path/filepath"
	"sourcebook/internal/models"
	"testing"
)

func TestInitDB_CreatesDirectoryAndTables(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "sourcebook_db_test_*")
	if err != nil {
		t.Fatalf("Failed to create temp dir: %v", err)
	}
	defer os.RemoveAll(tempDir)

	dbPath := filepath.Join(tempDir, "nested", "custom", "test_sourcebook.db")
	db, err := InitDB(dbPath)
	if err != nil {
		t.Fatalf("InitDB failed: %v", err)
	}
	defer db.Close()

	if _, err := os.Stat(dbPath); os.IsNotExist(err) {
		t.Fatalf("Database file was not created at %s", dbPath)
	}

	repo := NewRepository(db)
	settings, err := repo.GetSettings()
	if err != nil {
		t.Fatalf("GetSettings failed: %v", err)
	}
	if settings == nil {
		t.Fatal("Expected default settings, got nil")
	}
}

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
		Title:      "Doc 1",
	}
	if err := repo.AddSource(src1); err != nil {
		t.Fatalf("AddSource 1 failed: %v", err)
	}

	src2 := &models.SourceRecord{
		ID:         "source-2",
		NotebookID: nb.ID,
		Title:      "Doc 2",
	}
	if err := repo.AddSource(src2); err != nil {
		t.Fatalf("AddSource 2 failed: %v", err)
	}

	// 1. Save chunks for source-1
	chunks1 := []models.DocumentChunk{
		{
			ID:         "c1-1",
			NotebookID: nb.ID,
			SourceID:   src1.ID,
			ChunkIndex: 0,
			Content:    "Chunk 1 of Doc 1",
			Embedding:  []float32{0.1, 0.2, 0.3},
		},
	}
	if err := repo.SaveChunks(nb.ID, chunks1); err != nil {
		t.Fatalf("SaveChunks 1 failed: %v", err)
	}

	// 2. Save chunks for source-2 (e.g. Chat discovered a new web source)
	chunks2 := []models.DocumentChunk{
		{
			ID:         "c2-1",
			NotebookID: nb.ID,
			SourceID:   src2.ID,
			ChunkIndex: 0,
			Content:    "Chunk 1 of Doc 2",
			Embedding:  []float32{0.4, 0.5, 0.6},
		},
	}
	if err := repo.SaveChunks(nb.ID, chunks2); err != nil {
		t.Fatalf("SaveChunks 2 failed: %v", err)
	}

	// 3. Verify that chunks for BOTH source-1 and source-2 are present!
	savedChunks, err := repo.GetChunksByNotebook(nb.ID)
	if err != nil {
		t.Fatalf("GetChunksByNotebook failed: %v", err)
	}

	if len(savedChunks) != 2 {
		t.Fatalf("Expected 2 chunks preserved across both sources, got %d", len(savedChunks))
	}

	foundSrc1, foundSrc2 := false, false
	for _, ch := range savedChunks {
		if ch.SourceID == src1.ID {
			foundSrc1 = true
		}
		if ch.SourceID == src2.ID {
			foundSrc2 = true
		}
	}
	if !foundSrc1 || !foundSrc2 {
		t.Fatalf("Source chunks lost: foundSrc1=%v, foundSrc2=%v", foundSrc1, foundSrc2)
	}
}

func TestSaveMemoryPair_ChronologicalOrder(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "sourcebook_memory_test_*")
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
	nb, err := repo.CreateNotebook("Memory Notebook", "Desc")
	if err != nil {
		t.Fatalf("CreateNotebook failed: %v", err)
	}

	err = repo.SaveMemoryPair(nb.ID, "msg-1", "Hello user query", []float32{0.1}, "msg-2", "Hello assistant answer", []float32{0.2})
	if err != nil {
		t.Fatalf("SaveMemoryPair failed: %v", err)
	}

	records, err := repo.GetMemoryByNotebook(nb.ID)
	if err != nil {
		t.Fatalf("GetMemoryByNotebook failed: %v", err)
	}

	if len(records) != 2 {
		t.Fatalf("Expected 2 memory records, got %d", len(records))
	}

	if records[0].Role != "user" || records[0].Content != "Hello user query" {
		t.Errorf("Expected first record to be user query, got role=%s content=%s", records[0].Role, records[0].Content)
	}

	if records[1].Role != "assistant" || records[1].Content != "Hello assistant answer" {
		t.Errorf("Expected second record to be assistant answer, got role=%s content=%s", records[1].Role, records[1].Content)
	}
}

func TestGetNotebooks_SourceCount(t *testing.T) {
	tempDir, err := os.MkdirTemp("", "sourcebook_notebooks_test_*")
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
	nb1, err := repo.CreateNotebook("Notebook 1", "Desc 1")
	if err != nil {
		t.Fatalf("CreateNotebook 1 failed: %v", err)
	}

	nb2, err := repo.CreateNotebook("Notebook 2", "Desc 2")
	if err != nil {
		t.Fatalf("CreateNotebook 2 failed: %v", err)
	}

	err = repo.AddSource(&models.SourceRecord{ID: "s1", NotebookID: nb1.ID, Title: "Source 1"})
	if err != nil {
		t.Fatalf("AddSource failed: %v", err)
	}
	err = repo.AddSource(&models.SourceRecord{ID: "s2", NotebookID: nb1.ID, Title: "Source 2"})
	if err != nil {
		t.Fatalf("AddSource failed: %v", err)
	}

	notebooks, err := repo.GetNotebooks()
	if err != nil {
		t.Fatalf("GetNotebooks failed: %v", err)
	}

	if len(notebooks) != 2 {
		t.Fatalf("Expected 2 notebooks, got %d", len(notebooks))
	}

	for _, nb := range notebooks {
		if nb.ID == nb1.ID {
			if len(nb.Sources) != 2 {
				t.Errorf("Expected 2 sources for nb1, got %d", len(nb.Sources))
			}
		} else if nb.ID == nb2.ID {
			if len(nb.Sources) != 0 {
				t.Errorf("Expected 0 sources for nb2, got %d", len(nb.Sources))
			}
		}
	}
}
