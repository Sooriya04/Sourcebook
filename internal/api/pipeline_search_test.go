package api

import (
	"context"
	"fmt"
	"testing"

	"sourcebook/internal/controller"
	"sourcebook/internal/database"
	"sourcebook/internal/models"
	"sourcebook/internal/registry"
)

type mockSearchProvider struct {
	name    string
	results []models.SearchResult
	err     error
}

func (m *mockSearchProvider) Name() string {
	return m.name
}

func (m *mockSearchProvider) Search(ctx context.Context, query string, options models.SearchOptions) ([]models.SearchResult, error) {
	return m.results, m.err
}

func setupTestAPIWithProvider(prov *mockSearchProvider) (*API, func(), error) {
	db, err := database.InitDB(":memory:")
	if err != nil {
		return nil, nil, err
	}
	repo := database.NewRepository(db)

	reg := registry.NewProviderRegistry()
	reg.Register(prov)
	c := controller.NewUnifiedSearchController(reg)

	api := &API{
		repo:             repo,
		searchController: c,
	}

	cleanup := func() {
		db.Close()
	}
	return api, cleanup, nil
}

func TestSearchPipelineSources_PropagatesWebSearchError(t *testing.T) {
	failingProv := &mockSearchProvider{
		name: "duckduckgo",
		err:  fmt.Errorf("simulated searxng timeout"),
	}

	api, cleanup, err := setupTestAPIWithProvider(failingProv)
	if err != nil {
		t.Fatalf("Failed to setup test API: %v", err)
	}
	defer cleanup()

	_, _, err = api.searchPipelineSources(context.Background(), "golang rag", 5, "")
	if err == nil {
		t.Fatal("Expected search error to be returned, but got nil (error was swallowed)")
	}

	expectedSub := "search failed: simulated searxng timeout"
	if err.Error() != expectedSub {
		t.Fatalf("Expected error %q, got %q", expectedSub, err.Error())
	}
}

func TestSearchPipelineSources_SucceedsWithResults(t *testing.T) {
	successProv := &mockSearchProvider{
		name: "duckduckgo",
		results: []models.SearchResult{
			{Title: "Result 1", URL: "https://example.com/1"},
			{Title: "Result 2", URL: "https://example.com/2"},
		},
	}

	api, cleanup, err := setupTestAPIWithProvider(successProv)
	if err != nil {
		t.Fatalf("Failed to setup test API: %v", err)
	}
	defer cleanup()

	urls, _, err := api.searchPipelineSources(context.Background(), "golang rag", 5, "")
	if err != nil {
		t.Fatalf("Expected no error, got: %v", err)
	}
	if len(urls) != 2 {
		t.Fatalf("Expected 2 URLs, got %d", len(urls))
	}
	if urls[0] != "https://example.com/1" || urls[1] != "https://example.com/2" {
		t.Fatalf("Unexpected URLs returned: %v", urls)
	}
}
