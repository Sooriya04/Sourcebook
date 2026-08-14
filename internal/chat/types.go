package chat

import (
	"sourcebook/internal/llm"
)

type ChatRequest struct {
	Query           string        `json:"query"`
	NotebookID      string        `json:"notebook_id,omitempty"`
	MaxSources      int           `json:"max_sources,omitempty"`
	ScopedSourceIDs []string      `json:"scoped_source_ids,omitempty"`
	Mode            string        `json:"mode"` // "notebook", "web", "hybrid"
	History         []llm.Message `json:"history,omitempty"`
}

type ChatResponse struct {
	Query      string                 `json:"query"`
	Answer     string                 `json:"answer"`
	Sources    []SourceCitationDetail `json:"sources"`
	DurationMs int64                  `json:"duration_ms"`
	Context    string                 `json:"context"` // "Notebook", "Web", "Notebook + Web"
}

type SourceCitationDetail struct {
	Index      int    `json:"index"`
	Title      string `json:"title"`
	URL        string `json:"url"`
	SourceType string `json:"source_type"` // "Notebook", "Web", "YouTube", "Arxiv"
	Snippet    string `json:"snippet,omitempty"`
}
