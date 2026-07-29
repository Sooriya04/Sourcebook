package models

import "time"

type ChunkRecord struct {
	ID         string                 `json:"id"`
	JobID      string                 `json:"job_id"`
	DocumentID string                 `json:"document_id,omitempty"`
	SourceID   string                 `json:"source_id,omitempty"`
	Index      int                    `json:"index"`
	Text       string                 `json:"text"`
	Metadata   map[string]interface{} `json:"metadata,omitempty"`
	CreatedAt  time.Time              `json:"created_at"`
	UpdatedAt  time.Time              `json:"updated_at"`
}
