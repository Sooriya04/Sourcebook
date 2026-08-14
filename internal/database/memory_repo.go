package database

import (
	"fmt"
	"sourcebook/internal/models"
	"sourcebook/internal/vector"
	"time"

	"github.com/google/uuid"
)

// SaveMemory persists a chat memory entry with vector embeddings.
func (r *Repository) SaveMemory(notebookID, messageID, role, content string, embedding []float32) error {
	id := uuid.NewString()
	now := time.Now().UTC()
	embeddingBytes := vector.Float32SliceToBytes(embedding)

	query := `INSERT INTO chat_memory (id, notebook_id, message_id, role, content, embedding, created_at)
	          VALUES (?, ?, ?, ?, ?, ?, ?)`

	_, err := r.db.Exec(query, id, notebookID, messageID, role, content, embeddingBytes, now)
	if err != nil {
		return fmt.Errorf("failed to insert memory record: %w", err)
	}
	return nil
}

// GetMemoryByNotebook retrieves all memory records for a notebook ordered chronologically.
func (r *Repository) GetMemoryByNotebook(notebookID string) ([]models.MemoryRecord, error) {
	query := `SELECT id, notebook_id, message_id, role, content, embedding, created_at
	          FROM chat_memory WHERE notebook_id = ? ORDER BY created_at ASC`

	rows, err := r.db.Query(query, notebookID)
	if err != nil {
		return nil, fmt.Errorf("failed to query chat memory: %w", err)
	}
	defer rows.Close()

	var records []models.MemoryRecord
	for rows.Next() {
		var m models.MemoryRecord
		var embeddingBytes []byte
		err := rows.Scan(&m.ID, &m.NotebookID, &m.MessageID, &m.Role, &m.Content, &embeddingBytes, &m.CreatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan memory row: %w", err)
		}
		m.Embedding = vector.BytesToFloat32Slice(embeddingBytes)
		records = append(records, m)
	}
	return records, nil
}
