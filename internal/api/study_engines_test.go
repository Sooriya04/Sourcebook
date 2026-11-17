package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"sourcebook/internal/database"
	"sourcebook/internal/llm"
	"sourcebook/internal/models"
	"sourcebook/internal/synthesis"
)

func setupTestStudyEnv(t *testing.T, llmResponse string) (*API, *models.Notebook, func()) {
	mockLLM := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		resp := map[string]interface{}{
			"choices": []map[string]interface{}{
				{"message": map[string]string{"content": llmResponse}},
			},
		}
		json.NewEncoder(w).Encode(resp)
	}))

	tempDir, err := os.MkdirTemp("", "study_test_*")
	if err != nil {
		t.Fatalf("failed to create temp dir: %v", err)
	}

	db, err := database.InitDB(":memory:")
	if err != nil {
		mockLLM.Close()
		os.RemoveAll(tempDir)
		t.Fatalf("failed to init db: %v", err)
	}

	repo := database.NewRepository(db)
	nb, err := repo.CreateNotebook("Study Test Notebook", "Test Description")
	if err != nil {
		db.Close()
		mockLLM.Close()
		os.RemoveAll(tempDir)
		t.Fatalf("failed to create notebook: %v", err)
	}

	_ = repo.AddSource(&models.SourceRecord{
		ID:         "src-1",
		NotebookID: nb.ID,
		Title:      "RAG Architecture",
		Content:    "Retrieval-Augmented Generation grounds LLM answers with retrieved context.",
	})

	llmClient := llm.NewClientWithConfig("openai", mockLLM.URL, "test-model", "test-key")
	synthesizer := synthesis.NewSynthesizer(llmClient)

	api := &API{
		repo:        repo,
		llmClient:   llmClient,
		synthesizer: synthesizer,
	}

	teardown := func() {
		db.Close()
		mockLLM.Close()
		os.RemoveAll(tempDir)
	}

	return api, nb, teardown
}

func TestHandleQuiz(t *testing.T) {
	mockJSON := `[
		{
			"id": 1,
			"question": "What is RAG?",
			"options": ["Retrieval-Augmented Generation", "Random Access Gate", "Read And Go", "Relational AI Graph"],
			"answerIndex": 0,
			"explanation": "RAG grounds answers with context."
		}
	]`

	api, nb, cleanup := setupTestStudyEnv(t, mockJSON)
	defer cleanup()

	body, _ := json.Marshal(map[string]string{"notebook_id": nb.ID})
	req := httptest.NewRequest(http.MethodPost, "/api/sourcebook/v1/study/quiz", bytes.NewReader(body))
	w := httptest.NewRecorder()

	api.HandleQuiz(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d: %s", w.Code, w.Body.String())
	}

	var resp QuizResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response JSON: %v", err)
	}

	if len(resp.Questions) != 1 || resp.Questions[0].Question != "What is RAG?" {
		t.Errorf("unexpected quiz questions: %+v", resp.Questions)
	}
}

func TestHandleFAQ(t *testing.T) {
	mockJSON := `[
		{"q": "What is RAG?", "a": "Retrieval-Augmented Generation."}
	]`

	api, nb, cleanup := setupTestStudyEnv(t, mockJSON)
	defer cleanup()

	body, _ := json.Marshal(map[string]string{"notebook_id": nb.ID})
	req := httptest.NewRequest(http.MethodPost, "/api/sourcebook/v1/study/faq", bytes.NewReader(body))
	w := httptest.NewRecorder()

	api.HandleFAQ(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d: %s", w.Code, w.Body.String())
	}

	var resp FAQResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response JSON: %v", err)
	}

	if len(resp.FAQ) != 1 || resp.FAQ[0].Q != "What is RAG?" {
		t.Errorf("unexpected FAQ items: %+v", resp.FAQ)
	}
}

func TestHandleBriefing(t *testing.T) {
	mockJSON := `{
		"summary": "This domain focuses on grounded AI.",
		"concepts": [{"term": "RAG", "definition": "Retrieval-Augmented Generation."}],
		"questions": ["How to optimize retrieval latency?"]
	}`

	api, nb, cleanup := setupTestStudyEnv(t, mockJSON)
	defer cleanup()

	body, _ := json.Marshal(map[string]string{"notebook_id": nb.ID})
	req := httptest.NewRequest(http.MethodPost, "/api/sourcebook/v1/study/briefing", bytes.NewReader(body))
	w := httptest.NewRecorder()

	api.HandleBriefing(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d: %s", w.Code, w.Body.String())
	}

	var resp BriefingResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response JSON: %v", err)
	}

	if resp.Summary == "" || len(resp.Concepts) != 1 {
		t.Errorf("unexpected briefing response: %+v", resp)
	}
}
