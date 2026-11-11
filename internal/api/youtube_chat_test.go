package api

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"sourcebook/internal/database"
	"sourcebook/internal/llm"
	"sourcebook/internal/models"
)

func TestHandleYouTubeChat_UncachedTranscriptFallback(t *testing.T) {
	// 1. Mock upstream YouTube microservice returning transcripts
	mockYTService := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/youtube/transcript" {
			w.Header().Set("Content-Type", "application/json")
			resp := map[string]interface{}{
				"transcript": []map[string]interface{}{
					{"text": "Hello world from video transcript", "start": 5.0, "duration": 3.0},
					{"text": "Concluding remarks and insights", "start": 10.0, "duration": 4.0},
				},
			}
			json.NewEncoder(w).Encode(resp)
			return
		}
		http.NotFound(w, r)
	}))
	defer mockYTService.Close()

	origYTURL := os.Getenv("YOUTUBE_SERVICE_URL")
	defer os.Setenv("YOUTUBE_SERVICE_URL", origYTURL)
	os.Setenv("YOUTUBE_SERVICE_URL", mockYTService.URL)

	// 2. Mock upstream LLM streaming responses
	mockLLM := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "text/event-stream")
		flusher, _ := w.(http.Flusher)
		chunk1 := `data: {"choices":[{"delta":{"content":"According to the video "}}]}` + "\n\n"
		w.Write([]byte(chunk1))
		if flusher != nil {
			flusher.Flush()
		}
		chunk2 := `data: {"choices":[{"delta":{"content":"[00:05], hello world."}}]}` + "\n\n"
		w.Write([]byte(chunk2))
		if flusher != nil {
			flusher.Flush()
		}
		w.Write([]byte("data: [DONE]\n\n"))
		if flusher != nil {
			flusher.Flush()
		}
	}))
	defer mockLLM.Close()

	origLLMProv := os.Getenv("LLM_PROVIDER")
	origLLMURL := os.Getenv("LLM_URL")
	origLLMModel := os.Getenv("LLM_MODEL")
	defer func() {
		os.Setenv("LLM_PROVIDER", origLLMProv)
		os.Setenv("LLM_URL", origLLMURL)
		os.Setenv("LLM_MODEL", origLLMModel)
	}()
	os.Setenv("LLM_PROVIDER", "openai")
	os.Setenv("LLM_URL", mockLLM.URL)
	os.Setenv("LLM_MODEL", "mock-model")

	// 3. Init DB & API
	db, err := database.InitDB(":memory:")
	if err != nil {
		t.Fatalf("InitDB failed: %v", err)
	}
	defer db.Close()
	repo := database.NewRepository(db)

	llmClient := llm.NewClient()
	api := &API{
		repo:      repo,
		llmClient: llmClient,
	}

	testVideoID := "testvid1234"

	// Ensure video is not cached yet
	cached, err := repo.GetYouTubeVideo(context.Background(), testVideoID)
	if err != nil {
		t.Fatalf("GetYouTubeVideo failed: %v", err)
	}
	if cached != nil {
		t.Fatalf("Expected nil cache, got %+v", cached)
	}

	// 4. Request YouTube chat on uncached video
	payload, _ := json.Marshal(map[string]interface{}{
		"video_id": testVideoID,
		"query":    "What was said in the intro?",
	})
	req := httptest.NewRequest(http.MethodPost, "/api/sourcebook/v1/youtube/chat", bytes.NewReader(payload))
	w := httptest.NewRecorder()

	api.HandleYouTubeChat(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("HandleYouTubeChat returned status %d: %s", w.Code, w.Body.String())
	}

	// 5. Verify that video details and transcript were fetched and cached in SQLite
	cachedAfter, err := repo.GetYouTubeVideo(context.Background(), testVideoID)
	if err != nil {
		t.Fatalf("GetYouTubeVideo failed: %v", err)
	}
	if cachedAfter == nil {
		t.Fatalf("Expected video to be cached after chat fallback, but found nil")
	}

	var segs []models.YouTubeSegment
	if err := json.Unmarshal([]byte(cachedAfter.SegmentsJSON), &segs); err != nil {
		t.Fatalf("Failed to parse cached segments: %v", err)
	}
	if len(segs) != 2 {
		t.Fatalf("Expected 2 cached segments, got %d", len(segs))
	}
	if segs[0].Text != "Hello world from video transcript" {
		t.Errorf("Unexpected segment text: %s", segs[0].Text)
	}

	// 6. Verify SSE response stream
	respBody := w.Body.String()
	if !bytes.Contains([]byte(respBody), []byte("data: [DONE]")) {
		t.Errorf("Expected stream to finish with [DONE], got: %s", respBody)
	}

	// 7. Verify chat messages persisted
	msgs, err := repo.GetYouTubeChatMessages(context.Background(), testVideoID)
	if err != nil {
		t.Fatalf("GetYouTubeChatMessages failed: %v", err)
	}
	if len(msgs) < 2 {
		t.Fatalf("Expected at least 2 chat messages persisted, got %d", len(msgs))
	}
}
