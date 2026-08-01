package database

import (
	"sourcebook/internal/models"
	"time"

	"github.com/google/uuid"
)

func (r *Repository) CreateNote(notebookID, content string) (*models.Note, error) {
	note := &models.Note{
		ID:         uuid.NewString(),
		NotebookID: notebookID,
		Content:    content,
		CreatedAt:  time.Now().UTC(),
		UpdatedAt:  time.Now().UTC(),
	}

	query := `INSERT INTO notes (id, notebook_id, content, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`
	_, err := r.db.Exec(query, note.ID, note.NotebookID, note.Content, note.CreatedAt, note.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return note, nil
}

func (r *Repository) GetNotesByNotebook(notebookID string) ([]models.Note, error) {
	query := `SELECT id, notebook_id, content, created_at, updated_at FROM notes WHERE notebook_id = ? ORDER BY created_at DESC`
	rows, err := r.db.Query(query, notebookID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notes []models.Note
	for rows.Next() {
		var n models.Note
		if err := rows.Scan(&n.ID, &n.NotebookID, &n.Content, &n.CreatedAt, &n.UpdatedAt); err != nil {
			return nil, err
		}
		notes = append(notes, n)
	}
	return notes, nil
}
