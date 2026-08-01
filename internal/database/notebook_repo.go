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
