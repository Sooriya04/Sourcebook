package models

import "time"

// SearchOptions controls how providers should search and filter results.
type SearchOptions struct {
	Web        bool
	Images     bool
	Videos     bool
	News       bool
	PDFs       bool
	Docs       bool
	MaxResults   int
	Language     string
	SafeSearch   bool
	Provider     string // "searxng", "duckduckgo", "both"
	SearxngLimit int
	DdgLimit     int
}

// SearchResult is the normalized cross-provider result shape.
type SearchResult struct {
	ID          string                 `json:"id"`
	Title       string                 `json:"title"`
	URL         string                 `json:"url"`
	Snippet     string                 `json:"snippet"`
	ImageURL    string                 `json:"image_url,omitempty"`
	Thumbnail   string                 `json:"thumbnail,omitempty"`
	Source      string                 `json:"source"`
	Author      string                 `json:"author,omitempty"`
	PublishedAt time.Time              `json:"published_at,omitempty"`
	Language    string                 `json:"language,omitempty"`
	Category    string                 `json:"category,omitempty"`
	Score       float64                `json:"score"`
	Metadata    map[string]interface{} `json:"metadata,omitempty"`
}
