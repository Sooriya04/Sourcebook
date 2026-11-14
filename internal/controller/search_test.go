package controller

import (
	"context"
	"errors"
	"strings"
	"testing"

	"sourcebook/internal/models"
	"sourcebook/internal/registry"
)

type mockProvider struct {
	name    string
	results []models.SearchResult
	err     error
}

func (m *mockProvider) Name() string {
	return m.name
}

func (m *mockProvider) Search(ctx context.Context, query string, options models.SearchOptions) ([]models.SearchResult, error) {
	return m.results, m.err
}

func TestUnifiedSearchController_BothProvidersFailReturnsError(t *testing.T) {
	reg := registry.NewProviderRegistry()
	reg.Register(&mockProvider{
		name: "duckduckgo",
		err:  errors.New("ddg rate limited"),
	})
	reg.Register(&mockProvider{
		name: "searxng",
		err:  errors.New("searxng connection refused"),
	})

	c := NewUnifiedSearchController(reg)

	results, err := c.Search(context.Background(), "golang", models.SearchOptions{
		Provider: "both",
	})

	if err == nil {
		t.Fatalf("expected error when both providers fail, got nil")
	}

	errMsg := err.Error()
	if !strings.Contains(errMsg, "ddg rate limited") || !strings.Contains(errMsg, "searxng connection refused") {
		t.Errorf("expected combined error message to contain both provider errors, got: %s", errMsg)
	}

	if len(results) != 0 {
		t.Errorf("expected 0 results, got %d", len(results))
	}
}

func TestUnifiedSearchController_PartialFailureReturnsAvailableResults(t *testing.T) {
	reg := registry.NewProviderRegistry()
	reg.Register(&mockProvider{
		name: "duckduckgo",
		err:  errors.New("ddg timeout"),
	})
	reg.Register(&mockProvider{
		name: "searxng",
		results: []models.SearchResult{
			{Title: "SearXNG Result", URL: "https://example.com/searxng"},
		},
	})

	c := NewUnifiedSearchController(reg)

	results, err := c.Search(context.Background(), "golang", models.SearchOptions{
		Provider: "both",
	})

	if err != nil {
		t.Fatalf("expected nil error when partial results exist, got %v", err)
	}

	if len(results) != 1 || results[0].Title != "SearXNG Result" {
		t.Errorf("expected 1 result from SearXNG, got %+v", results)
	}
}
