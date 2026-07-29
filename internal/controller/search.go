package controller

import (
	"context"
	"sourcebook/internal/models"
	"sourcebook/internal/providers"
	"sourcebook/internal/registry"
	"sync"
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
	activeProviders := c.registry.GetAll()

	var wg sync.WaitGroup
	resultsCh := make(chan []models.SearchResult, len(activeProviders))

	for _, p := range activeProviders {
		wg.Add(1)
		go func(prov providers.SearchProvider) {
			defer wg.Done()

			// Each provider gets its own timeout so one slow source does not block the rest.
			provCtx, cancel := context.WithTimeout(ctx, 10*time.Second)
			defer cancel()

			res, err := prov.Search(provCtx, query, options)
			if err != nil {
				// Ignore individual provider errors so the unified search still succeeds.
				return
			}
			resultsCh <- res
		}(p)
	}

	go func() {
		wg.Wait()
		close(resultsCh)
	}()

	var allResults []models.SearchResult
	for res := range resultsCh {
		allResults = append(allResults, res...)
	}

	// The first pass returns merged results; ranking can be layered on top later.
	return allResults, nil
}
