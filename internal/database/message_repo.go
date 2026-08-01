package database

import (
	"sourcebook/internal/models"
	"time"

	"github.com/google/uuid"
)

func (r *Repository) AddMessage(notebookID, role, content string) (*models.ChatMessage, error) {
	msg := &models.ChatMessage{
		ID:         uuid.NewString(),
		NotebookID: notebookID,
		Role:       role,
		Content:    content,
		CreatedAt:  time.Now().UTC(),
	}

	query := `INSERT INTO chat_messages (id, notebook_id, role, content, created_at) VALUES (?, ?, ?, ?, ?)`
	_, err := r.db.Exec(query, msg.ID, msg.NotebookID, msg.Role, msg.Content, msg.CreatedAt)
	if err != nil {
		return nil, err
	}
	return msg, nil
}

func (r *Repository) GetMessagesByNotebook(notebookID string) ([]models.ChatMessage, error) {
	query := `SELECT id, notebook_id, role, content, created_at FROM chat_messages WHERE notebook_id = ? ORDER BY created_at ASC`
	rows, err := r.db.Query(query, notebookID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var msgs []models.ChatMessage
	for rows.Next() {
		var m models.ChatMessage
		if err := rows.Scan(&m.ID, &m.NotebookID, &m.Role, &m.Content, &m.CreatedAt); err != nil {
			return nil, err
		}
		msgs = append(msgs, m)
	}
	return msgs, nil
}
