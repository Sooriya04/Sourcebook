package models

import (
	"encoding/json"
	"time"
)

type JobStatus string

const (
	JobStatusPending   JobStatus = "pending"
	JobStatusRunning   JobStatus = "running"
	JobStatusSucceeded JobStatus = "succeeded"
	JobStatusFailed    JobStatus = "failed"
)

type PipelineJob struct {
	ID          string          `json:"id"`
	Query       string          `json:"query"`
	MaxSources  int             `json:"max_sources"`
	Status      JobStatus       `json:"status"`
	Attempt     int             `json:"attempt"`
	SourceIDs   []string        `json:"source_ids,omitempty"`
	DocumentIDs []string        `json:"document_ids,omitempty"`
	ChunkIDs    []string        `json:"chunk_ids,omitempty"`
	Result      json.RawMessage `json:"result,omitempty"`
	Error       string          `json:"error,omitempty"`
	CreatedAt   time.Time       `json:"created_at"`
	StartedAt   time.Time       `json:"started_at,omitempty"`
	FinishedAt  time.Time       `json:"finished_at,omitempty"`
	UpdatedAt   time.Time       `json:"updated_at"`
}
