package database

import (
	"database/sql"
	"fmt"
	"sourcebook/internal/models"
	"time"

	"github.com/google/uuid"
)

func (r *Repository) CreateNotebook(title, description string) (*models.Notebook, error) {
	nb := &models.Notebook{
		ID:          uuid.NewString(),
		Title:       title,
		Description: description,
		CreatedAt:   time.Now().UTC(),
		UpdatedAt:   time.Now().UTC(),
	}

	query := `INSERT INTO notebooks (id, title, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
	_, err := r.db.Exec(query, nb.ID, nb.Title, nb.Description, nb.CreatedAt, nb.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create notebook: %w", err)
	}
	return nb, nil
}

func (r *Repository) GetNotebooks() ([]models.Notebook, error) {
	query := `SELECT id, title, description, created_at, updated_at FROM notebooks ORDER BY updated_at DESC`
	rows, err := r.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query notebooks: %w", err)
	}
	defer rows.Close()

	var notebooks []models.Notebook
	for rows.Next() {
		var nb models.Notebook
		if err := rows.Scan(&nb.ID, &nb.Title, &nb.Description, &nb.CreatedAt, &nb.UpdatedAt); err != nil {
			return nil, err
		}
		notebooks = append(notebooks, nb)
	}
	return notebooks, nil
}

func (r *Repository) GetNotebook(id string) (*models.Notebook, error) {
	query := `SELECT id, title, description, created_at, updated_at FROM notebooks WHERE id = ?`
	row := r.db.QueryRow(query, id)

	var nb models.Notebook
	if err := row.Scan(&nb.ID, &nb.Title, &nb.Description, &nb.CreatedAt, &nb.UpdatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &nb, nil
}

func (r *Repository) DeleteNotebook(id string) error {
	query := `DELETE FROM notebooks WHERE id = ?`
	_, err := r.db.Exec(query, id)
	return err
}

func (r *Repository) UpdateNotebook(id string, title, description string) error {
	query := `UPDATE notebooks SET title = ?, description = ?, updated_at = ? WHERE id = ?`
	_, err := r.db.Exec(query, title, description, time.Now().UTC(), id)
	return err
}

func (r *Repository) SyncNotebookSources(notebookID string, sources []models.SourceRecord) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Delete existing
	if _, err := tx.Exec(`DELETE FROM sources WHERE notebook_id = ?`, notebookID); err != nil {
		return err
	}

	// 2. Insert new
	query := `INSERT INTO sources (id, notebook_id, job_id, query, provider, title, url, canonical_url, snippet, content, image_url, created_at, updated_at) 
	          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	stmt, err := tx.Prepare(query)
	if err != nil {
		return err
	}
	defer stmt.Close()

	now := time.Now().UTC()
	for _, src := range sources {
		id := src.ID
		if id == "" {
			id = uuid.NewString()
		}
		_, err := stmt.Exec(id, notebookID, src.JobID, src.Query, src.Provider, src.Title, src.URL, src.CanonicalURL, src.Snippet, src.Content, src.ImageURL, now, now)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *Repository) SyncNotebookNotes(notebookID string, notes []models.Note) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Delete existing
	if _, err := tx.Exec(`DELETE FROM notes WHERE notebook_id = ?`, notebookID); err != nil {
		return err
	}

	// 2. Insert new
	query := `INSERT INTO notes (id, notebook_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
	stmt, err := tx.Prepare(query)
	if err != nil {
		return err
	}
	defer stmt.Close()

	now := time.Now().UTC()
	for _, n := range notes {
		id := n.ID
		if id == "" {
			id = uuid.NewString()
		}
		_, err := stmt.Exec(id, notebookID, n.Content, now, now)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}

func (r *Repository) SyncNotebookMessages(notebookID string, messages []models.ChatMessage) error {
	tx, err := r.db.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// 1. Delete existing
	if _, err := tx.Exec(`DELETE FROM chat_messages WHERE notebook_id = ?`, notebookID); err != nil {
		return err
	}

	// 2. Insert new
	query := `INSERT INTO chat_messages (id, notebook_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)`
	stmt, err := tx.Prepare(query)
	if err != nil {
		return err
	}
	defer stmt.Close()

	for _, m := range messages {
		id := m.ID
		if id == "" {
			id = uuid.NewString()
		}
		
		// Ensure CreatedAt is not zero
		createdAt := m.CreatedAt
		if createdAt.IsZero() {
			createdAt = time.Now().UTC()
		}

		_, err := stmt.Exec(id, notebookID, m.Role, m.Content, createdAt)
		if err != nil {
			return err
		}
	}

	return tx.Commit()
}
