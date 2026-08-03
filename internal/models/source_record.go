package models

import "time"

type SourceRecord struct {
	ID           string                 `json:"id"`
	NotebookID   string                 `json:"notebook_id,omitempty"`
	JobID        string                 `json:"job_id"`
	Query        string                 `json:"query,omitempty"`
	Provider     string                 `json:"provider,omitempty"`
	Type         string                 `json:"type,omitempty"`
	Title        string                 `json:"title,omitempty"`
	URL          string                 `json:"url"`
	CanonicalURL string                 `json:"canonical_url"`
	Snippet      string                 `json:"snippet,omitempty"`
	Content      string                 `json:"content,omitempty"`
	ImageURL     string                 `json:"image_url,omitempty"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt    time.Time              `json:"created_at"`
	UpdatedAt    time.Time              `json:"updated_at"`
}

