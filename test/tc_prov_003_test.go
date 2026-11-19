package test

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"sourcebook/internal/api"
	"sourcebook/internal/database"
	"sourcebook/internal/llm"
	"sourcebook/internal/models"
)

// TC-PROV-003: Empty Key Update Preserves Credential
// Scenario & Input Payload:
// 1. Seed user_settings with an existing API key (e.g., "secret-original-key").
// 2. Send PUT /settings with a new model/URL but an empty llm_api_key: "".
// Expected Output & Assertion:
// - Existing API key in SQLite user_settings is preserved and not overwritten with empty string.
// - In-memory LLM client retains or updates configuration while keeping the existing credential intact.
func TestTC_PROV_003_EmptyKeyUpdatePreservesCredential(t *testing.T) {
	db, err := database.InitDB(":memory:")
	if err != nil {
		t.Fatalf("failed to init db: %v", err)
	}
	defer db.Close()

	repo := database.NewRepository(db)

	// Step 1: Seed initial user settings with a valid API key
	initialSettings := models.UserSettings{
		LLMProvider: "openai",
		LLMBaseURL:  "https://api.openai.com/v1",
		LLMModel:    "gpt-4o",
		LLMAPIKey:   "secret-original-key",
	}
	if err := repo.UpdateSettings(initialSettings); err != nil {
		t.Fatalf("failed to seed initial settings: %v", err)
	}

	// Verify initial persistence
	stored, err := repo.GetSettings()
	if err != nil {
		t.Fatalf("failed to get seeded settings: %v", err)
	}
	if stored.LLMAPIKey != "secret-original-key" {
		t.Fatalf("expected initial key 'secret-original-key', got '%s'", stored.LLMAPIKey)
	}

	llmClient := llm.NewClientWithConfig("openai", stored.LLMBaseURL, stored.LLMModel, stored.LLMAPIKey)
	serverAPI := api.NewTestAPI(repo, llmClient, nil)

	// Step 2: Send PUT /api/sourcebook/v1/settings with updated model and URL, but empty LLMAPIKey ("")
	updatePayload := models.UserSettings{
		LLMProvider: "openai",
		LLMBaseURL:  "https://api.custom-proxy.com/v1",
		LLMModel:    "gpt-4o-mini",
		LLMAPIKey:   "", // intentionally blank to preserve existing credential
	}
	bodyBytes, err := json.Marshal(updatePayload)
	if err != nil {
		t.Fatalf("failed to marshal payload: %v", err)
	}

	req := httptest.NewRequest(http.MethodPut, "/api/sourcebook/v1/settings", bytes.NewReader(bodyBytes))
	w := httptest.NewRecorder()
	serverAPI.HandleSettings(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("HandleSettings returned status %d: %s", w.Code, w.Body.String())
	}

	// Step 3: Verify that in SQLite user_settings, the key was NOT wiped out
	afterUpdate, err := repo.GetSettings()
	if err != nil {
		t.Fatalf("failed to get updated settings: %v", err)
	}

	if afterUpdate.LLMBaseURL != "https://api.custom-proxy.com/v1" {
		t.Errorf("expected updated BaseURL 'https://api.custom-proxy.com/v1', got '%s'", afterUpdate.LLMBaseURL)
	}
	if afterUpdate.LLMModel != "gpt-4o-mini" {
		t.Errorf("expected updated Model 'gpt-4o-mini', got '%s'", afterUpdate.LLMModel)
	}
	if afterUpdate.LLMAPIKey != "secret-original-key" {
		t.Fatalf("API key was overwritten or cleared! Expected 'secret-original-key', got '%s'", afterUpdate.LLMAPIKey)
	}

	// Step 4: Verify in-memory client state also retained the original credential
	_, _, _, clientKey := llmClient.GetConfig()
	if clientKey != "secret-original-key" {
		t.Fatalf("in-memory LLM client lost API key! Expected 'secret-original-key', got '%s'", clientKey)
	}
}
