package models

import "time"

type UserSettings struct {
	ID             string    `json:"id"`
	SearchProvider string    `json:"search_provider"` // "duckduckgo", "searxng", "both"
	MaxSources     int       `json:"max_sources"`
	SearxngSplit   int       `json:"searxng_split"` // e.g. 3
	DdgSplit       int       `json:"ddg_split"`     // e.g. 2
	UpdatedAt      time.Time `json:"updated_at"`
}
