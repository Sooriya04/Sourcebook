package database

import (
	"os"
	"path/filepath"
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
