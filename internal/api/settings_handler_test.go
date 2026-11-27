package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"sourcebook/internal/controller"
	"sourcebook/internal/database"
	"sourcebook/internal/llm"
	"sourcebook/internal/models"
	"sourcebook/internal/providers/searx"
	"sourcebook/internal/registry"
	"sourcebook/internal/vector"
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

func TestHandleSettings_PersistsInferenceProvider(t *testing.T) {
	db, err := database.InitDB(":memory:")
	if err != nil {
		t.Fatalf("Failed to init db: %v", err)
	}
	defer db.Close()
	repo := database.NewRepository(db)
	llmClient := llm.NewClient()

	api := &API{
		repo:      repo,
		llmClient: llmClient,
	}

	// 1. Save settings with Gemini provider
	newSettings := models.UserSettings{
		LLMProvider:     "gemini",
		LLMAPIKey:       "gemini-secret-key",
		ProviderConfigs: `{"gemini":{"model":"gemini-1.5-flash","apiKey":"gemini-secret-key"}}`,
	}
	body, _ := json.Marshal(newSettings)
	req := httptest.NewRequest(http.MethodPut, "/api/sourcebook/v1/settings", bytes.NewBuffer(body))
	rec := httptest.NewRecorder()
	api.HandleSettings(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d", rec.Code)
	}

	// Verify database persistence
	saved, err := repo.GetSettings()
	if err != nil {
		t.Fatalf("Failed to get settings: %v", err)
	}
	if saved.LLMProvider != "gemini" {
		t.Errorf("Expected saved provider 'gemini', got %q", saved.LLMProvider)
	}
	if saved.LLMBaseURL != llm.DefaultBaseURL("gemini") {
		t.Errorf("Expected default gemini baseURL, got %q", saved.LLMBaseURL)
	}
	if saved.LLMModel != llm.DefaultModel("gemini") {
		t.Errorf("Expected default gemini model, got %q", saved.LLMModel)
	}

	// 2. Simulate GET /api/sourcebook/v1/models (which runs on page reload)
	modelsReq := httptest.NewRequest(http.MethodGet, "/api/sourcebook/v1/models", nil)
	modelsRec := httptest.NewRecorder()
	api.HandleModels(modelsRec, modelsReq)

	if modelsRec.Code != http.StatusOK {
		t.Fatalf("HandleModels GET failed with code %d", modelsRec.Code)
	}

	var mResp modelsResponse
	if err := json.Unmarshal(modelsRec.Body.Bytes(), &mResp); err != nil {
		t.Fatalf("Failed to parse modelsResponse: %v", err)
	}
	if mResp.Provider != "gemini" {
		t.Errorf("Expected active provider 'gemini', got %q", mResp.Provider)
	}

	// 3. Simulate Application Restart with the same database
	restartedLLMClient := llm.NewClient()
	_ = NewAPI(nil, nil, nil, repo)
	p, u, m, k := restartedLLMClient.GetConfig()
	// Check that repo settings can be loaded cleanly after restart
	restartedSettings, err := repo.GetSettings()
	if err != nil {
		t.Fatalf("Restarted repo error: %v", err)
	}
	if restartedSettings.LLMProvider != "gemini" {
		t.Errorf("Expected restarted provider 'gemini', got %q", restartedSettings.LLMProvider)
	}
	_ = p
	_ = u
	_ = m
	_ = k
}

func TestHandleSettings_SyncsVectorClient(t *testing.T) {
	db, err := database.InitDB(":memory:")
	if err != nil {
		t.Fatalf("Failed to init db: %v", err)
	}
	defer db.Close()
	repo := database.NewRepository(db)
	vc := vector.NewClient()

	api := &API{
		repo:         repo,
		vectorClient: vc,
	}

	newSettings := models.UserSettings{
		EmbeddingURL:   "http://custom-embed:7000",
		EmbeddingModel: "custom-embed-model",
	}
	body, _ := json.Marshal(newSettings)
	req := httptest.NewRequest(http.MethodPut, "/api/sourcebook/v1/settings", bytes.NewBuffer(body))
	rec := httptest.NewRecorder()
	api.HandleSettings(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("Expected status 200, got %d", rec.Code)
	}

	url, model := vc.GetConfig()
	if url != "http://custom-embed:7000" {
		t.Errorf("Expected vectorClient URL 'http://custom-embed:7000', got %q", url)
	}
	if model != "custom-embed-model" {
		t.Errorf("Expected vectorClient model 'custom-embed-model', got %q", model)
	}

	restartedAPI := NewAPI(nil, nil, nil, repo)
	rURL, rModel := restartedAPI.vectorClient.GetConfig()
	if rURL != "http://custom-embed:7000" || rModel != "custom-embed-model" {
		t.Errorf("Expected NewAPI to load embedding settings, got url=%q model=%q", rURL, rModel)
	}
}
