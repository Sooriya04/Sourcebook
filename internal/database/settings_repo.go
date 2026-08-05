package database

import (
	"database/sql"
	"fmt"
	"sourcebook/internal/models"
	"time"
)

// GetSettings retrieves the global user settings, returning defaults if they don't exist yet.
func (r *Repository) GetSettings() (*models.UserSettings, error) {
	query := `SELECT id, search_provider, max_sources, searxng_split, ddg_split, youtube_enabled, youtube_max_sources, updated_at FROM user_settings WHERE id = 'global'`
	row := r.db.QueryRow(query)

	var settings models.UserSettings
	if err := row.Scan(&settings.ID, &settings.SearchProvider, &settings.MaxSources, &settings.SearxngSplit, &settings.DdgSplit, &settings.YoutubeEnabled, &settings.YoutubeMaxSources, &settings.UpdatedAt); err != nil {
		if err == sql.ErrNoRows {
			// Return default settings
			return &models.UserSettings{
				ID:             "global",
				SearchProvider: "duckduckgo",
				MaxSources:     5,
				SearxngSplit:   3,
				DdgSplit:       2,
				YoutubeEnabled: false,
				YoutubeMaxSources: 3,
				UpdatedAt:      time.Now(),
			}, nil
		}
		return nil, fmt.Errorf("failed to get user settings: %w", err)
	}
	return &settings, nil
}

// UpdateSettings updates the global user settings.
func (r *Repository) UpdateSettings(s models.UserSettings) error {
	query := `
	INSERT INTO user_settings (id, search_provider, max_sources, searxng_split, ddg_split, youtube_enabled, youtube_max_sources, updated_at)
	VALUES ('global', ?, ?, ?, ?, ?, ?, ?)
	ON CONFLICT(id) DO UPDATE SET
		search_provider=excluded.search_provider,
		max_sources=excluded.max_sources,
		searxng_split=excluded.searxng_split,
		ddg_split=excluded.ddg_split,
		youtube_enabled=excluded.youtube_enabled,
		youtube_max_sources=excluded.youtube_max_sources,
		updated_at=excluded.updated_at
	`
	_, err := r.db.Exec(query, s.SearchProvider, s.MaxSources, s.SearxngSplit, s.DdgSplit, s.YoutubeEnabled, s.YoutubeMaxSources, time.Now())
	if err != nil {
		return fmt.Errorf("failed to update user settings: %w", err)
	}
	return nil
}
