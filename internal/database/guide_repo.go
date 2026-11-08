package database

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"sourcebook/internal/models"
	"time"
)

func (r *Repository) GetNotebookGuide(notebookID string) (*models.NotebookGuide, error) {
	query := `SELECT notebook_id, summary, topics_json, questions_json, created_at, updated_at FROM notebook_guides WHERE notebook_id = ?`
	row := r.db.QueryRow(query, notebookID)

	var g models.NotebookGuide
	var topicsJSON, questionsJSON sql.NullString
	if err := row.Scan(&g.NotebookID, &g.Summary, &topicsJSON, &questionsJSON, &g.CreatedAt, &g.UpdatedAt); err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to get notebook guide: %w", err)
	}

	if topicsJSON.Valid && topicsJSON.String != "" {
		_ = json.Unmarshal([]byte(topicsJSON.String), &g.Topics)
	}
	if questionsJSON.Valid && questionsJSON.String != "" {
		_ = json.Unmarshal([]byte(questionsJSON.String), &g.SuggestedQuestions)
	}
	if g.Topics == nil {
		g.Topics = []string{}
	}
	if g.SuggestedQuestions == nil {
		g.SuggestedQuestions = []string{}
	}

	return &g, nil
}

func (r *Repository) UpsertNotebookGuide(g *models.NotebookGuide) error {
	topicsB, _ := json.Marshal(g.Topics)
	questionsB, _ := json.Marshal(g.SuggestedQuestions)

	query := `INSERT INTO notebook_guides (notebook_id, summary, topics_json, questions_json, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
		ON CONFLICT(notebook_id) DO UPDATE SET
			summary = excluded.summary,
			topics_json = excluded.topics_json,
			questions_json = excluded.questions_json,
			updated_at = excluded.updated_at`

	now := time.Now().UTC()
	if g.CreatedAt.IsZero() {
		g.CreatedAt = now
	}
	g.UpdatedAt = now

	_, err := r.db.Exec(query, g.NotebookID, g.Summary, string(topicsB), string(questionsB), g.CreatedAt, g.UpdatedAt)
	return err
}
