package controller

import (
	"context"
	"fmt"
	"sourcebook/internal/models"
	"sourcebook/internal/registry"
	"time"
)

type UnifiedSearchController struct {
	registry *registry.ProviderRegistry
}

func NewUnifiedSearchController(r *registry.ProviderRegistry) *UnifiedSearchController {
	return &UnifiedSearchController{
		registry: r,
	}
}

func (c *UnifiedSearchController) Search(ctx context.Context, query string, options models.SearchOptions) ([]models.SearchResult, error) {
	// 1. Try SearXNG first
	if searxProv, err := c.registry.Get("searxng"); err == nil {
		provCtx, cancel := context.WithTimeout(ctx, 8*time.Second)
		res, err := searxProv.Search(provCtx, query, options)
		cancel()
		if err == nil && len(res) > 0 {
			return res, nil
		}
	}

	// 2. Fallback to DuckDuckGo if SearXNG is unavailable or returned no results
	if ddgProv, err := c.registry.Get("duckduckgo"); err == nil {
		provCtx, cancel := context.WithTimeout(ctx, 8*time.Second)
		res, err := ddgProv.Search(provCtx, query, options)
		cancel()
		if err == nil {
			return res, nil
		}
		return nil, fmt.Errorf("search failed: SearXNG is down and DuckDuckGo fallback returned error: %w", err)
	}

	return []models.SearchResult{}, nil
}
