package models

import "time"

type MemoryRecord struct {
	ID         string    `json:"id"`
	NotebookID string    `json:"notebook_id"`
	MessageID  string    `json:"message_id"`
	Role       string    `json:"role"`
	Content    string    `json:"content"`
	Embedding  []float32 `json:"embedding"`
	CreatedAt  time.Time `json:"created_at"`
}
