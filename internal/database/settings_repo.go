package database

import (
	"database/sql"
	"fmt"
	"sourcebook/internal/models"
	"time"
)

// GetSettings retrieves the global user settings, returning defaults if they don't exist yet.
func (r *Repository) GetSettings() (*models.UserSettings, error) {
	query := `SELECT id, search_provider, max_sources, searxng_split, ddg_split, youtube_enabled, youtube_max_sources,
		COALESCE(deep_crawl_enabled, 0), COALESCE(deep_crawl_limit, 5), COALESCE(deep_crawl_depth, 1),
		COALESCE(llm_provider, ''), COALESCE(llm_base_url, ''), COALESCE(llm_model, ''), COALESCE(llm_api_key, ''),
		COALESCE(searxng_url, ''), COALESCE(searqon_url, ''), COALESCE(youtube_service_url, ''),
		COALESCE(embedding_provider, ''), COALESCE(embedding_url, ''), COALESCE(embedding_model, ''),
		updated_at FROM user_settings WHERE id = 'global'`
	row := r.db.QueryRow(query)

	var s models.UserSettings
	err := row.Scan(&s.ID, &s.SearchProvider, &s.MaxSources, &s.SearxngSplit, &s.DdgSplit,
		&s.YoutubeEnabled, &s.YoutubeMaxSources, &s.DeepCrawlEnabled, &s.DeepCrawlLimit, &s.DeepCrawlDepth,
		&s.LLMProvider, &s.LLMBaseURL, &s.LLMModel, &s.LLMAPIKey,
		&s.SearxngURL, &s.SearqonURL, &s.YoutubeServiceURL,
		&s.EmbeddingProvider, &s.EmbeddingURL, &s.EmbeddingModel,
		&s.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return &models.UserSettings{
				ID:                "global",
				SearchProvider:    "duckduckgo",
				MaxSources:        5,
				SearxngSplit:      3,
				DdgSplit:          2,
				YoutubeEnabled:    false,
				YoutubeMaxSources: 3,
				DeepCrawlEnabled:  false,
				DeepCrawlLimit:    5,
				DeepCrawlDepth:    1,
				SearxngURL:        "http://localhost:8080",
				SearqonURL:        "http://127.0.0.1:4001/scrape/batch",
				YoutubeServiceURL: "http://127.0.0.1:6001",
				EmbeddingModel:    "nomic-embed-text",
				UpdatedAt:         time.Now(),
			}, nil
		}
		return nil, fmt.Errorf("failed to get user settings: %w", err)
	}

	if s.SearxngURL == "" {
		s.SearxngURL = "http://localhost:8080"
	}
	if s.SearqonURL == "" {
		s.SearqonURL = "http://127.0.0.1:4001/scrape/batch"
	}
	if s.YoutubeServiceURL == "" {
		s.YoutubeServiceURL = "http://127.0.0.1:6001"
	}
	if s.EmbeddingProvider == "" {
		s.EmbeddingProvider = "local"
	}
	if s.EmbeddingModel == "" {
		s.EmbeddingModel = "nomic-embed-text"
	}

	return &s, nil
}

// UpdateSettings updates the global user settings.
func (r *Repository) UpdateSettings(s models.UserSettings) error {
	existing, _ := r.GetSettings()
	apiKey := s.LLMAPIKey
	if apiKey == "" && existing != nil {
		apiKey = existing.LLMAPIKey
	}

	query := `
	INSERT INTO user_settings (id, search_provider, max_sources, searxng_split, ddg_split,
		youtube_enabled, youtube_max_sources, deep_crawl_enabled, deep_crawl_limit, deep_crawl_depth,
		llm_provider, llm_base_url, llm_model, llm_api_key,
		searxng_url, searqon_url, youtube_service_url,
		embedding_provider, embedding_url, embedding_model, updated_at)
	VALUES ('global', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
	ON CONFLICT(id) DO UPDATE SET
		search_provider=excluded.search_provider,
		max_sources=excluded.max_sources,
		searxng_split=excluded.searxng_split,
		ddg_split=excluded.ddg_split,
		youtube_enabled=excluded.youtube_enabled,
		youtube_max_sources=excluded.youtube_max_sources,
		deep_crawl_enabled=excluded.deep_crawl_enabled,
		deep_crawl_limit=excluded.deep_crawl_limit,
		deep_crawl_depth=excluded.deep_crawl_depth,
		llm_provider=CASE WHEN excluded.llm_provider != '' THEN excluded.llm_provider ELSE user_settings.llm_provider END,
		llm_base_url=CASE WHEN excluded.llm_base_url != '' THEN excluded.llm_base_url ELSE user_settings.llm_base_url END,
		llm_model=CASE WHEN excluded.llm_model != '' THEN excluded.llm_model ELSE user_settings.llm_model END,
		llm_api_key=CASE WHEN excluded.llm_api_key != '' THEN excluded.llm_api_key ELSE user_settings.llm_api_key END,
		searxng_url=excluded.searxng_url,
		searqon_url=excluded.searqon_url,
		youtube_service_url=excluded.youtube_service_url,
		embedding_provider=excluded.embedding_provider,
		embedding_url=excluded.embedding_url,
		embedding_model=excluded.embedding_model,
		updated_at=excluded.updated_at
	`
	_, err := r.db.Exec(query, s.SearchProvider, s.MaxSources, s.SearxngSplit, s.DdgSplit,
		s.YoutubeEnabled, s.YoutubeMaxSources, s.DeepCrawlEnabled, s.DeepCrawlLimit, s.DeepCrawlDepth,
		s.LLMProvider, s.LLMBaseURL, s.LLMModel, apiKey,
		s.SearxngURL, s.SearqonURL, s.YoutubeServiceURL,
		s.EmbeddingProvider, s.EmbeddingURL, s.EmbeddingModel, time.Now())
	if err != nil {
		return fmt.Errorf("failed to update user settings: %w", err)
	}
	return nil
}

// UpdateLLMSettings persists the LLM provider, endpoint, model, and API key into database.
func (r *Repository) UpdateLLMSettings(provider, baseURL, model, apiKey string) error {
	existing, _ := r.GetSettings()
	if apiKey == "" && existing != nil {
		apiKey = existing.LLMAPIKey
	}

	query := `
	INSERT INTO user_settings (id, search_provider, max_sources, searxng_split, ddg_split, llm_provider, llm_base_url, llm_model, llm_api_key, updated_at)
	VALUES ('global', 'duckduckgo', 5, 3, 2, ?, ?, ?, ?, ?)
	ON CONFLICT(id) DO UPDATE SET
		llm_provider=excluded.llm_provider,
		llm_base_url=excluded.llm_base_url,
		llm_model=excluded.llm_model,
		llm_api_key=CASE WHEN excluded.llm_api_key != '' THEN excluded.llm_api_key ELSE user_settings.llm_api_key END,
		updated_at=excluded.updated_at
	`
	_, err := r.db.Exec(query, provider, baseURL, model, apiKey, time.Now())
	if err != nil {
		return fmt.Errorf("failed to update llm settings: %w", err)
	}
	return nil
}
