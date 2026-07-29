package models

import "time"

type DocumentRecord struct {
	ID           string                 `json:"id"`
	JobID        string                 `json:"job_id"`
	SourceID     string                 `json:"source_id,omitempty"`
	Title        string                 `json:"title,omitempty"`
	URL          string                 `json:"url,omitempty"`
	CanonicalURL string                 `json:"canonical_url,omitempty"`
	Content      string                 `json:"content,omitempty"`
	Metadata     map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt    time.Time              `json:"created_at"`
	UpdatedAt    time.Time              `json:"updated_at"`
}
