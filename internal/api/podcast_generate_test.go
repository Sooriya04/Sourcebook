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

func TestHandleGeneratePodcast_DrainsStreamToCompletion(t *testing.T) {
	streamDrained := false
	mockAudioServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/synthesize/stream" {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", "text/event-stream")
		flusher, _ := w.(http.Flusher)
		w.Write([]byte("data: {\"step\": \"turn_done\"}\n\n"))
		if flusher != nil {
			flusher.Flush()
		}
		w.Write([]byte("data: {\"step\": \"complete\", \"duration\": 1.0}\n\n"))
		if flusher != nil {
			flusher.Flush()
		}
		streamDrained = true
	}))
	defer mockAudioServer.Close()

	origAudio := os.Getenv("AUDIO_SERVICE_URL")
	defer os.Setenv("AUDIO_SERVICE_URL", origAudio)
	os.Setenv("AUDIO_SERVICE_URL", mockAudioServer.URL)

	mockLLM := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		content := `{"title":"T","summary":"S","takeaways":["TK"],"turns":[{"speaker":"host1","text":"Hi"}]}`
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
	nb, err := repo.CreateNotebook("Test Notebook", "")
	if err != nil {
		t.Fatalf("failed to create notebook: %v", err)
	}
	repo.AddSource(&models.SourceRecord{
		ID:         "src1",
		NotebookID: nb.ID,
		Title:      "Title",
		Content:    "Content",
	})

	api := &API{
		repo:        repo,
		synthesizer: synthesis.NewSynthesizer(nil),
	}

	reqBody := `{"notebook_id": "` + nb.ID + `"}`
	req := httptest.NewRequest(http.MethodPost, "/api/sourcebook/v1/study/podcast/generate", strings.NewReader(reqBody))
	w := httptest.NewRecorder()

	api.HandleGeneratePodcast(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK, got %d: %s", w.Code, w.Body.String())
	}
	if !streamDrained {
		t.Fatal("expected audio synthesis stream to be drained to completion")
	}
}

func TestHandleGeneratePodcast_AudioServiceError(t *testing.T) {
	mockAudioServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		http.Error(w, "internal synthesis error", http.StatusInternalServerError)
	}))
	defer mockAudioServer.Close()

	origAudio := os.Getenv("AUDIO_SERVICE_URL")
	defer os.Setenv("AUDIO_SERVICE_URL", origAudio)
	os.Setenv("AUDIO_SERVICE_URL", mockAudioServer.URL)

	mockLLM := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		content := `{"turns":[{"speaker":"host1","text":"Hi"}]}`
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
	nb, err := repo.CreateNotebook("Test Notebook 2", "")
	if err != nil {
		t.Fatalf("failed to create notebook: %v", err)
	}
	repo.AddSource(&models.SourceRecord{
		ID:         "src2",
		NotebookID: nb.ID,
		Title:      "Title",
		Content:    "Content",
	})

	api := &API{
		repo:        repo,
		synthesizer: synthesis.NewSynthesizer(nil),
	}

	reqBody := `{"notebook_id": "` + nb.ID + `"}`
	req := httptest.NewRequest(http.MethodPost, "/api/sourcebook/v1/study/podcast/generate", strings.NewReader(reqBody))
	w := httptest.NewRecorder()

	api.HandleGeneratePodcast(w, req)

	if w.Code != http.StatusBadGateway {
		t.Fatalf("expected 502 Bad Gateway, got %d: %s", w.Code, w.Body.String())
	}
}
