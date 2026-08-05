package controller

import (
	"context"
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
	provider := options.Provider
	if provider == "" {
		provider = "duckduckgo" // fallback default
	}

	if provider == "duckduckgo" {
		if ddgProv, err := c.registry.Get("duckduckgo"); err == nil {
			provCtx, cancel := context.WithTimeout(ctx, 8*time.Second)
			defer cancel()
			options.MaxResults = options.MaxResults // use default
			return ddgProv.Search(provCtx, query, options)
		}
	} else if provider == "searxng" {
		if searxProv, err := c.registry.Get("searxng"); err == nil {
			provCtx, cancel := context.WithTimeout(ctx, 8*time.Second)
			defer cancel()
			options.MaxResults = options.MaxResults
			return searxProv.Search(provCtx, query, options)
		}
	} else if provider == "both" {
		type resultWrap struct {
			res []models.SearchResult
			err error
		}
		ch := make(chan resultWrap, 2)

		// DuckDuckGo Go-Routine
		go func() {
			ddgProv, err := c.registry.Get("duckduckgo")
			if err != nil {
				ch <- resultWrap{nil, err}
				return
			}
			provCtx, cancel := context.WithTimeout(ctx, 8*time.Second)
			defer cancel()
			opt := options
			opt.MaxResults = options.DdgLimit
			res, e := ddgProv.Search(provCtx, query, opt)
			ch <- resultWrap{res, e}
		}()

		// SearXNG Go-Routine
		go func() {
			searxProv, err := c.registry.Get("searxng")
			if err != nil {
				ch <- resultWrap{nil, err}
				return
			}
			provCtx, cancel := context.WithTimeout(ctx, 8*time.Second)
			defer cancel()
			opt := options
			opt.MaxResults = options.SearxngLimit
			res, e := searxProv.Search(provCtx, query, opt)
			ch <- resultWrap{res, e}
		}()

		var combined []models.SearchResult
		for i := 0; i < 2; i++ {
			wrap := <-ch
			if wrap.err == nil && wrap.res != nil {
				combined = append(combined, wrap.res...)
			}
		}

		return combined, nil
	}

	return []models.SearchResult{}, nil
}
