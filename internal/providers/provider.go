package providers

import (
	"context"

	"sourcebook/internal/models"
)

// SearchProvider defines the interface every search provider must implement
type SearchProvider interface {
	Name() string
	Search(ctx context.Context, query string, options models.SearchOptions) ([]models.SearchResult, error)
}
