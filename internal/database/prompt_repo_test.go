package database

import (
	"path/filepath"
	"testing"
)

func TestPromptRepoCRUDAndHistory(t *testing.T) {
	dbPath := filepath.Join(t.TempDir(), "test.db")
	db, err := InitDB(dbPath)
	if err != nil {
		t.Fatalf("InitDB failed: %v", err)
	}
	defer db.Close()

	repo := NewRepository(db)

	saved, err := repo.SaveCustomPrompt(CustomPrompt{
		Name:          "Paper Critique",
		Description:   "Critique methods",
		Instructions:  "List 3 flaws.",
		Tags:          []string{"research"},
		ExecutionMode: "custom_priority",
	})
	if err != nil {
		t.Fatalf("SaveCustomPrompt failed: %v", err)
	}

	list, err := repo.ListCustomPrompts()
	if err != nil || len(list) != 1 || list[0].ID != saved.ID {
		t.Fatalf("unexpected prompt list: %+v, err=%v", list, err)
	}

	// Update existing prompt
	saved.Name = "Updated Critique"
	if _, err := repo.SaveCustomPrompt(*saved); err != nil {
		t.Fatalf("update SaveCustomPrompt failed: %v", err)
	}
	list, _ = repo.ListCustomPrompts()
	if list[0].Name != "Updated Critique" {
		t.Fatalf("expected updated name, got %q", list[0].Name)
	}

	if err := repo.DeleteCustomPrompt(saved.ID); err != nil {
		t.Fatalf("DeleteCustomPrompt failed: %v", err)
	}
	list, _ = repo.ListCustomPrompts()
	if len(list) != 0 {
		t.Fatalf("expected empty list after delete, got %d", len(list))
	}

	run, err := repo.RecordPromptExecution(PromptExecution{
		NotebookID:    "nb1",
		NotebookTitle: "ML Notes",
		PromptName:    "Paper Critique",
		Instructions:  "List 3 flaws.",
		ExecutionMode: "standard",
		SourceMode:    "all",
		SourceCount:   4,
		Status:        "running",
	})
	if err != nil {
		t.Fatalf("RecordPromptExecution failed: %v", err)
	}

	if err := repo.UpdatePromptExecutionStatus(run.ID, "completed"); err != nil {
		t.Fatalf("UpdatePromptExecutionStatus failed: %v", err)
	}

	hist, err := repo.ListPromptExecutions(20)
	if err != nil || len(hist) != 1 || hist[0].Status != "completed" {
		t.Fatalf("unexpected history: %+v, err=%v", hist, err)
	}
}
