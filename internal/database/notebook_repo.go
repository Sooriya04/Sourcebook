package database

import (
	"database/sql"
	"fmt"
	"sourcebook/internal/models"
	"strings"
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
	
	// Close rows before executing new queries
	rows.Close()

	// Fetch sources for each notebook to populate the count
	for i := range notebooks {
		sources, err := r.GetSourcesByNotebook(notebooks[i].ID)
		if err == nil {
			notebooks[i].Sources = sources
		}
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

	// Ensure all sources have IDs
	for i := range sources {
		if sources[i].ID == "" {
			sources[i].ID = uuid.NewString()
		}
	}

	// 1. Delete sources that are no longer present
	if len(sources) > 0 {
		placeholders := make([]string, len(sources))
		args := make([]interface{}, len(sources)+1)
		args[0] = notebookID
		for i, src := range sources {
			placeholders[i] = "?"
			args[i+1] = src.ID
		}
		// Safe to concatenate placeholders here as they are generated from slice length
		delQuery := fmt.Sprintf("DELETE FROM sources WHERE notebook_id = ? AND id NOT IN (%s)", strings.Join(placeholders, ","))
		if _, err := tx.Exec(delQuery, args...); err != nil {
			return err
		}
	} else {
		if _, err := tx.Exec(`DELETE FROM sources WHERE notebook_id = ?`, notebookID); err != nil {
			return err
		}
	}

	// 2. Upsert sources
	query := `INSERT INTO sources (id, notebook_id, job_id, query, provider, title, url, canonical_url, snippet, content, image_url, created_at, updated_at) 
	          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	          ON CONFLICT(id) DO UPDATE SET 
	              title = excluded.title, 
	              url = excluded.url, 
	              canonical_url = excluded.canonical_url, 
	              snippet = excluded.snippet, 
	              content = CASE WHEN excluded.content != '' THEN excluded.content ELSE sources.content END,
	              updated_at = excluded.updated_at`
	stmt, err := tx.Prepare(query)
	if err != nil {
		return err
	}
	defer stmt.Close()

	now := time.Now().UTC()
	for _, src := range sources {
		prov := src.Provider
		if prov == "" && src.Type != "" {
			prov = src.Type
		}
		_, err := stmt.Exec(src.ID, notebookID, src.JobID, src.Query, prov, src.Title, src.URL, src.CanonicalURL, src.Snippet, src.Content, src.ImageURL, now, now)
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

	validIDs := make(map[string]bool)
	now := time.Now().UTC()

	query := `INSERT INTO chat_messages (id, notebook_id, role, content, created_at) 
	          VALUES (?, ?, ?, ?, ?) 
	          ON CONFLICT(id) DO UPDATE SET content=excluded.content, role=excluded.role`
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
		validIDs[id] = true

		createdAt := m.CreatedAt
		if createdAt.IsZero() {
			createdAt = now
		}

		_, err := stmt.Exec(id, notebookID, m.Role, m.Content, createdAt)
		if err != nil {
			return err
		}
	}

	if len(validIDs) == 0 {
		if _, err := tx.Exec(`DELETE FROM chat_messages WHERE notebook_id = ?`, notebookID); err != nil {
			return err
		}
	} else {
		rows, err := tx.Query(`SELECT id FROM chat_messages WHERE notebook_id = ?`, notebookID)
		if err == nil {
			var toDelete []string
			for rows.Next() {
				var existingID string
				if err := rows.Scan(&existingID); err == nil {
					if !validIDs[existingID] {
						toDelete = append(toDelete, existingID)
					}
				}
			}
			rows.Close()
			for _, delID := range toDelete {
				tx.Exec(`DELETE FROM chat_messages WHERE id = ?`, delID)
			}
		}
	}

	return tx.Commit()
}
