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

func TestHandleFlashcards_ConversationalPreamble(t *testing.T) {
	// Mock LLM returning conversational preamble around a JSON codeblock / array
	mockLLM := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		content := `Sure! Here are the 2 flashcards you requested based on the material:

` + "```json" + `
[
  {"front": "What is SourceBook?", "back": "An open-source local-first NotebookLM alternative."},
  {"front": "What TTS does it use?", "back": "Kokoro-82M ONNX model."}
]
` + "```" + `

Hope this helps with your studies!`

		resp := map[string]interface{}{
			"choices": []map[string]interface{}{
				{"message": map[string]string{"content": content}},
			},
		}
		json.NewEncoder(w).Encode(resp)
	}))
	defer mockLLM.Close()

	origProv := os.Getenv("LLM_PROVIDER")
	origURL := os.Getenv("LLM_URL")
	origModel := os.Getenv("LLM_MODEL")
	defer func() {
		os.Setenv("LLM_PROVIDER", origProv)
		os.Setenv("LLM_URL", origURL)
		os.Setenv("LLM_MODEL", origModel)
	}()
	os.Setenv("LLM_PROVIDER", "openai")
	os.Setenv("LLM_URL", mockLLM.URL)
	os.Setenv("LLM_MODEL", "mock")

	db, err := database.InitDB(":memory:")
	if err != nil {
		t.Fatalf("InitDB failed: %v", err)
	}
	defer db.Close()

	repo := database.NewRepository(db)
	nb, err := repo.CreateNotebook("Study Test", "Test notebook for study flashcards")
	if err != nil {
		t.Fatalf("CreateNotebook failed: %v", err)
	}

	src := models.SourceRecord{
		ID:         "src-1",
		NotebookID: nb.ID,
		Title:      "Sourcebook Overview",
		Content:    "SourceBook is a local-first NotebookLM alternative using Kokoro-82M.",
	}
	if err := repo.AddSource(&src); err != nil {
		t.Fatalf("AddSource failed: %v", err)
	}

	// Add chunk
	chunk := models.DocumentChunk{
		ID:         "c1",
		NotebookID: nb.ID,
		SourceID:   src.ID,
		Content:    "SourceBook is a local-first NotebookLM alternative using Kokoro-82M.",
	}
	if err := repo.SaveChunks(nb.ID, []models.DocumentChunk{chunk}); err != nil {
		t.Fatalf("SaveChunks failed: %v", err)
	}

	llmClient := llm.NewClient()
	synth := synthesis.NewSynthesizer(llmClient)
	api := &API{
		repo:        repo,
		synthesizer: synth,
		llmClient:   llmClient,
	}

	reqBody, _ := json.Marshal(FlashcardRequest{
		NotebookID: nb.ID,
	})
	req := httptest.NewRequest(http.MethodPost, "/api/sourcebook/v1/study/flashcards", bytes.NewReader(reqBody))
	w := httptest.NewRecorder()

	api.HandleFlashcards(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	var resp FlashcardResponse
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if len(resp.Flashcards) != 2 {
		t.Fatalf("expected 2 flashcards parsed, got %d", len(resp.Flashcards))
	}

	if resp.Flashcards[0]["front"] != "What is SourceBook?" {
		t.Errorf("unexpected front: %s", resp.Flashcards[0]["front"])
	}
}
