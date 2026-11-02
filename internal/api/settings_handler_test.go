package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"sourcebook/internal/controller"
	"sourcebook/internal/database"
	"sourcebook/internal/models"
	"sourcebook/internal/providers/searx"
	"sourcebook/internal/registry"
)

func TestHandleSettings_SyncsSearchProvider(t *testing.T) {
	db, err := database.InitDB(":memory:")
	if err != nil {
		t.Fatalf("Failed to init db: %v", err)
	}
	defer db.Close()
	repo := database.NewRepository(db)

	reg := registry.NewProviderRegistry()
	searxProv := searx.NewSearXNGProvider("http://localhost:8080")
	reg.Register(searxProv)
	c := controller.NewUnifiedSearchController(reg)

	api := &API{
		repo:             repo,
		searchController: c,
	}

	newSettings := models.UserSettings{
		SearchProvider: "searxng",
		SearxngURL:     "http://custom-searxng:9000",
		MaxSources:     7,
	}

	body, _ := json.Marshal(newSettings)
	req := httptest.NewRequest(http.MethodPut, "/api/sourcebook/v1/settings", bytes.NewBuffer(body))
	rec := httptest.NewRecorder()

	api.HandleSettings(rec, req)

	if rec.Code != http.StatusOK {
		t.Errorf("Expected status 200, got %d", rec.Code)
	}

	if searxProv.BaseURL != "http://custom-searxng:9000" {
		t.Errorf("Expected SearXNG BaseURL to be synchronized to http://custom-searxng:9000, got %q", searxProv.BaseURL)
	}
}
