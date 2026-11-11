package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"sourcebook/internal/database"
	"sourcebook/internal/models"
	"sourcebook/internal/synthesis"
)

func TestHandleStreamPodcast_EmitsCompleteEvent(t *testing.T) {
	mockAudioServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		flusher, _ := w.(http.Flusher)
		w.Write([]byte("data: {\"step\": \"synthesizing\", \"progress\": 50}\n\n"))
		if flusher != nil {
			flusher.Flush()
		}
		w.Write([]byte("data: {\"step\": \"complete\", \"audio_url\": \"/audio/test.wav\"}\n\n"))
		if flusher != nil {
			flusher.Flush()
		}
	}))
	defer mockAudioServer.Close()

	origAudio := os.Getenv("AUDIO_SERVICE_URL")
	defer os.Setenv("AUDIO_SERVICE_URL", origAudio)
	os.Setenv("AUDIO_SERVICE_URL", mockAudioServer.URL)

	mockLLM := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		content := `{"title":"Stream Title","summary":"Stream Summary","takeaways":["T1"],"turns":[{"speaker":"host1","text":"Stream dialogue"}]}`
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
		t.Fatalf("database init failed: %v", err)
	}
	defer db.Close()
	repo := database.NewRepository(db)
	nb, err := repo.CreateNotebook("Stream Test Notebook", "")
	if err != nil {
		t.Fatalf("failed to create notebook: %v", err)
	}
	repo.AddSource(&models.SourceRecord{
		ID:         "src-stream-1",
		NotebookID: nb.ID,
		Title:      "Source Title",
		Content:    "Source Content",
	})

	api := &API{
		repo:        repo,
		synthesizer: synthesis.NewSynthesizer(nil),
	}

	reqBody := `{"notebook_id": "` + nb.ID + `", "force": "true"}`
	req := httptest.NewRequest(http.MethodPost, "/api/sourcebook/v1/study/podcast/stream", strings.NewReader(reqBody))
	w := httptest.NewRecorder()

	api.HandleStreamPodcast(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d: %s", w.Code, w.Body.String())
	}

	body := w.Body.String()
	if !strings.Contains(body, "event: progress\ndata: {\"step\": \"synthesizing\"") {
		t.Fatalf("expected event: progress for synthesizing step, got: %s", body)
	}
	if !strings.Contains(body, "event: complete\ndata: {\"step\": \"complete\"") {
		t.Fatalf("expected event: complete for complete step, got: %s", body)
	}
}
