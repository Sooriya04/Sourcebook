package database

import (
	"sourcebook/internal/models"
	"time"

	"github.com/google/uuid"
)

func (r *Repository) AddSource(src *models.SourceRecord) error {
	if src.ID == "" {
		src.ID = uuid.NewString()
	}
	src.CreatedAt = time.Now().UTC()
	src.UpdatedAt = src.CreatedAt

	query := `INSERT INTO sources (id, notebook_id, job_id, query, provider, title, url, canonical_url, snippet, image_url, created_at, updated_at) 
	          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
	_, err := r.db.Exec(query, src.ID, src.NotebookID, src.JobID, src.Query, src.Provider, src.Title, src.URL, src.CanonicalURL, src.Snippet, src.ImageURL, src.CreatedAt, src.UpdatedAt)
	return err
}

func (r *Repository) GetSourcesByNotebook(notebookID string) ([]models.SourceRecord, error) {
	query := `SELECT id, notebook_id, job_id, query, provider, title, url, canonical_url, snippet, image_url, created_at, updated_at 
	          FROM sources WHERE notebook_id = ? ORDER BY created_at ASC`
	rows, err := r.db.Query(query, notebookID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var sources []models.SourceRecord
	for rows.Next() {
		var src models.SourceRecord
		if err := rows.Scan(&src.ID, &src.NotebookID, &src.JobID, &src.Query, &src.Provider, &src.Title, &src.URL, &src.CanonicalURL, &src.Snippet, &src.ImageURL, &src.CreatedAt, &src.UpdatedAt); err != nil {
			return nil, err
		}
		sources = append(sources, src)
	}
	return sources, nil
}
