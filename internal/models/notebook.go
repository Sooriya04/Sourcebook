package models

import "time"

type Notebook struct {
	ID          string    `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

type Note struct {
	ID         string    `json:"id"`
	NotebookID string    `json:"notebook_id"`
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type ChatMessage struct {
	ID         string    `json:"id"`
	NotebookID string    `json:"notebook_id"`
	Role       string    `json:"role"` // "user" or "assistant"
	Content    string    `json:"content"`
	CreatedAt  time.Time `json:"created_at"`
}
