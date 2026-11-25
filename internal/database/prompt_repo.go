package database

import (
	"encoding/json"
	"strings"
	"time"

	"github.com/google/uuid"
)

// CustomPrompt represents a user-saved prompt in the Prompt Library.
type CustomPrompt struct {
	ID            string    `json:"id"`
	Name          string    `json:"name"`
	Description   string    `json:"description"`
	Instructions  string    `json:"instructions"`
	Category      string    `json:"category"`
	Tags          []string  `json:"tags"`
	ExecutionMode string    `json:"executionMode"`
	IsBuiltin     bool      `json:"isBuiltin"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

// PromptExecution represents a logged Prompt Studio execution.
type PromptExecution struct {
	ID            string    `json:"id"`
	NotebookID    string    `json:"notebookId"`
	NotebookTitle string    `json:"notebookTitle"`
	PromptName    string    `json:"promptName"`
	Description   string    `json:"description"`
	Instructions  string    `json:"instructions"`
	ExecutionMode string    `json:"executionMode"`
	SourceMode    string    `json:"sourceMode"`
	SourceCount   int       `json:"sourceCount"`
	Status        string    `json:"status"`
	ExecutedAt    time.Time `json:"executedAt"`
}

func (r *Repository) SaveCustomPrompt(p CustomPrompt) (*CustomPrompt, error) {
	now := time.Now().UTC()
	if strings.TrimSpace(p.ID) == "" {
		p.ID = "prm_" + uuid.NewString()[:8]
	}
	if strings.TrimSpace(p.Name) == "" {
		p.Name = "Untitled Prompt"
	}
	if strings.TrimSpace(p.Category) == "" {
		p.Category = "Saved"
	}
	if p.ExecutionMode != "custom_priority" {
		p.ExecutionMode = "standard"
	}
	if p.Tags == nil {
		p.Tags = []string{}
	}
	if p.CreatedAt.IsZero() {
		p.CreatedAt = now
	}
	p.UpdatedAt = now
	p.IsBuiltin = false

	tagsJSON, _ := json.Marshal(p.Tags)
	query := `
		INSERT INTO custom_prompts (id, name, description, instructions, category, tags_json, execution_mode, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(id) DO UPDATE SET
			name = excluded.name,
			description = excluded.description,
			instructions = excluded.instructions,
			category = excluded.category,
			tags_json = excluded.tags_json,
			execution_mode = excluded.execution_mode,
			updated_at = excluded.updated_at
	`
	if _, err := r.db.Exec(query, p.ID, p.Name, p.Description, p.Instructions, p.Category, string(tagsJSON), p.ExecutionMode, p.CreatedAt, p.UpdatedAt); err != nil {
		return nil, err
	}
	return &p, nil
}

func (r *Repository) ListCustomPrompts() ([]CustomPrompt, error) {
	rows, err := r.db.Query(`SELECT id, name, description, instructions, category, tags_json, execution_mode, created_at, updated_at FROM custom_prompts ORDER BY updated_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	prompts := []CustomPrompt{}
	for rows.Next() {
		var p CustomPrompt
		var tagsJSON string
		if err := rows.Scan(&p.ID, &p.Name, &p.Description, &p.Instructions, &p.Category, &tagsJSON, &p.ExecutionMode, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		_ = json.Unmarshal([]byte(tagsJSON), &p.Tags)
		if p.Tags == nil {
			p.Tags = []string{}
		}
		p.IsBuiltin = false
		prompts = append(prompts, p)
	}
	return prompts, nil
}

func (r *Repository) DeleteCustomPrompt(id string) error {
	_, err := r.db.Exec(`DELETE FROM custom_prompts WHERE id = ?`, id)
	return err
}

func (r *Repository) RecordPromptExecution(e PromptExecution) (*PromptExecution, error) {
	if strings.TrimSpace(e.ID) == "" {
		e.ID = "run_" + uuid.NewString()[:8]
	}
	if strings.TrimSpace(e.PromptName) == "" {
		e.PromptName = "Custom Prompt"
	}
	if e.ExecutedAt.IsZero() {
		e.ExecutedAt = time.Now().UTC()
	}
	if strings.TrimSpace(e.Status) == "" {
		e.Status = "completed"
	}
	query := `
		INSERT INTO prompt_executions (id, notebook_id, notebook_title, prompt_name, description, instructions, execution_mode, source_mode, source_count, status, executed_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	`
	if _, err := r.db.Exec(query, e.ID, e.NotebookID, e.NotebookTitle, e.PromptName, e.Description, e.Instructions, e.ExecutionMode, e.SourceMode, e.SourceCount, e.Status, e.ExecutedAt); err != nil {
		return nil, err
	}
	return &e, nil
}

func (r *Repository) UpdatePromptExecutionStatus(id, status string) error {
	_, err := r.db.Exec(`UPDATE prompt_executions SET status = ? WHERE id = ?`, status, id)
	return err
}

func (r *Repository) ListPromptExecutions(limit int) ([]PromptExecution, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	rows, err := r.db.Query(`SELECT id, notebook_id, notebook_title, prompt_name, description, instructions, execution_mode, source_mode, source_count, status, executed_at FROM prompt_executions ORDER BY executed_at DESC LIMIT ?`, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	list := []PromptExecution{}
	for rows.Next() {
		var e PromptExecution
		if err := rows.Scan(&e.ID, &e.NotebookID, &e.NotebookTitle, &e.PromptName, &e.Description, &e.Instructions, &e.ExecutionMode, &e.SourceMode, &e.SourceCount, &e.Status, &e.ExecutedAt); err != nil {
			return nil, err
		}
		list = append(list, e)
	}
	return list, nil
}
