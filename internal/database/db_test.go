package database

import (
	"os"
	"path/filepath"
	"testing"

	"sourcebook/internal/models"
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

func TestInitDB_ForeignIndexesExist(t *testing.T) {
	db, err := InitDB(":memory:")
	if err != nil {
		t.Fatalf("InitDB failed: %v", err)
	}
	defer db.Close()

	expectedIndexes := []string{
		"idx_sources_notebook_id",
		"idx_document_chunks_notebook_id",
		"idx_chat_messages_notebook_id",
		"idx_yt_chat_video_id",
	}

	rows, err := db.Query("SELECT name FROM sqlite_master WHERE type = 'index'")
	if err != nil {
		t.Fatalf("Querying sqlite_master failed: %v", err)
	}
	defer rows.Close()

	found := make(map[string]bool)
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			t.Fatalf("Row scan failed: %v", err)
		}
		found[name] = true
	}

	for _, idx := range expectedIndexes {
		if !found[idx] {
			t.Errorf("Expected index %s not found in sqlite_master", idx)
		}
	}
}

func TestSaveMemoryPair(t *testing.T) {
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
	nb, err := repo.CreateNotebook("Memory Test", "Desc")
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

	if err = repo.AddSource(&models.SourceRecord{ID: "s1", NotebookID: nb1.ID, Title: "Source 1"}); err != nil {
		t.Fatalf("AddSource failed: %v", err)
	}
	if err = repo.AddSource(&models.SourceRecord{ID: "s2", NotebookID: nb1.ID, Title: "Source 2"}); err != nil {
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
		if nb.ID == nb1.ID && len(nb.Sources) != 2 {
			t.Errorf("Expected 2 sources for nb1, got %d", len(nb.Sources))
		} else if nb.ID == nb2.ID && len(nb.Sources) != 0 {
			t.Errorf("Expected 0 sources for nb2, got %d", len(nb.Sources))
		}
	}
}
