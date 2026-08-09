package models

import "time"

type UserSettings struct {
	ID             string    `json:"id"`
	SearchProvider string    `json:"search_provider"` // "duckduckgo", "searxng", "both"
	MaxSources     int       `json:"max_sources"`
	SearxngSplit   int       `json:"searxng_split"` // e.g. 3
	DdgSplit       int       `json:"ddg_split"`     // e.g. 2
	YoutubeEnabled    bool      `json:"youtube_enabled"`
	YoutubeMaxSources int       `json:"youtube_max_sources"`
	DeepCrawlEnabled  bool      `json:"deep_crawl_enabled"`
	DeepCrawlLimit    int       `json:"deep_crawl_limit"`
	DeepCrawlDepth    int       `json:"deep_crawl_depth"`
	UpdatedAt         time.Time `json:"updated_at"`
}
