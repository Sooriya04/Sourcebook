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
	LLMProvider       string    `json:"llm_provider"`
	LLMBaseURL        string    `json:"llm_base_url"`
	LLMModel          string    `json:"llm_model"`
	LLMAPIKey         string    `json:"llm_api_key"`
	SearxngURL        string    `json:"searxng_url"`
	SearqonURL        string    `json:"searqon_url"`
	YoutubeServiceURL string    `json:"youtube_service_url"`
	EmbeddingProvider string    `json:"embedding_provider"`
	EmbeddingURL      string    `json:"embedding_url"`
	EmbeddingModel    string    `json:"embedding_model"`
	ProviderConfigs   string    `json:"provider_configs"`
	UpdatedAt         time.Time `json:"updated_at"`
}
