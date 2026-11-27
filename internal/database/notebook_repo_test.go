package database

import (
	"os"
	"path/filepath"
	"testing"
)

func TestDeleteNotebook_CleansUpOrphanAudio(t *testing.T) {
	db, err := InitDB(":memory:")
	if err != nil {
		t.Fatalf("InitDB failed: %v", err)
	}
	defer db.Close()
	repo := NewRepository(db)

	nb, err := repo.CreateNotebook("Audio Test", "Desc")
	if err != nil {
		t.Fatalf("CreateNotebook failed: %v", err)
	}

	// Create test audio artifacts
	audioDir := filepath.Join("database", "audio", nb.ID)
	if err := os.MkdirAll(audioDir, 0755); err != nil {
		t.Fatalf("MkdirAll failed: %v", err)
	}
	epFile := filepath.Join(audioDir, "ep1.json")
	_ = os.WriteFile(epFile, []byte(`{"title":"ep1"}`), 0644)
	wavFile := filepath.Join("database", "audio", nb.ID+".wav")
	_ = os.WriteFile(wavFile, []byte("fake wav"), 0644)
	jsonFile := filepath.Join("database", "audio", nb.ID+".json")
	_ = os.WriteFile(jsonFile, []byte(`{"title":"root"}`), 0644)

	// Clean up after test if DeleteNotebook didn't delete them
	defer func() {
		_ = os.RemoveAll(filepath.Join("database", "audio", nb.ID))
		_ = os.Remove(wavFile)
		_ = os.Remove(jsonFile)
	}()

	// Delete notebook
	if err := repo.DeleteNotebook(nb.ID); err != nil {
		t.Fatalf("DeleteNotebook failed: %v", err)
	}

	// Verify audio files/directories are gone
	if _, err := os.Stat(audioDir); !os.IsNotExist(err) {
		t.Errorf("expected audio dir %s to be deleted, got err: %v", audioDir, err)
	}
	if _, err := os.Stat(wavFile); !os.IsNotExist(err) {
		t.Errorf("expected wav file %s to be deleted, got err: %v", wavFile, err)
	}
	if _, err := os.Stat(jsonFile); !os.IsNotExist(err) {
		t.Errorf("expected json file %s to be deleted, got err: %v", jsonFile, err)
	}
}
