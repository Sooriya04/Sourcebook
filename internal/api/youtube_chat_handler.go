package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sourcebook/internal/database"
	"sourcebook/internal/llm"
	"sourcebook/internal/models"
	"strings"
	"time"
)

// HandleYouTubeChat handles streaming timestamp-grounded video Q&A via SSE.
func (a *API) HandleYouTubeChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		VideoID string        `json:"video_id"`
		Query   string        `json:"query"`
		History []llm.Message `json:"history"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.VideoID == "" || req.Query == "" {
		http.Error(w, "Valid 'video_id' and 'query' are required", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	videoID := ExtractYouTubeID(req.VideoID)
	if videoID == "" {
		videoID = req.VideoID
	}

	// 1. Retrieve video details & segments from DB (fallback to fetching if uncached or empty)
	title := "YouTube Video"
	var segments []models.YouTubeSegment

	if a.repo != nil {
		cached, err := a.repo.GetYouTubeVideo(ctx, videoID)
		if err == nil && cached != nil {
			title = cached.Title
			_ = json.Unmarshal([]byte(cached.SegmentsJSON), &segments)
		}

		if len(segments) == 0 {
			fetchedSegments, fetchErr := FetchYouTubeTranscriptSegments(ctx, videoID)
			if fetchErr == nil && len(fetchedSegments) > 0 {
				segments = fetchedSegments
				channel := "YouTube"
				if cached != nil && cached.Channel != "" {
					channel = cached.Channel
				} else {
					oTitle, oAuthor := FetchYouTubeMetadata(ctx, videoID)
					if title == "YouTube Video" && oTitle != "" {
						title = oTitle
					}
					if oAuthor != "" {
						channel = oAuthor
					}
				}

				var maxSecs float64
				for _, s := range segments {
					if end := s.Start + s.Duration; end > maxSecs {
						maxSecs = end
					}
				}
				durSecs := int(maxSecs)
				if durSecs == 0 && cached != nil && cached.DurationSeconds > 0 {
					durSecs = cached.DurationSeconds
					maxSecs = float64(durSecs)
				}
				chapters := generateSynthesizedChapters(segments, maxSecs)

				chapsBytes, _ := json.Marshal(chapters)
				segsBytes, _ := json.Marshal(segments)
				_ = a.repo.UpsertYouTubeVideo(ctx, &database.YouTubeVideoRecord{
					VideoID:         videoID,
					Title:           title,
					Channel:         channel,
					DurationSeconds: durSecs,
					ChaptersJSON:    string(chapsBytes),
					SegmentsJSON:    string(segsBytes),
					Status:          "synced",
				})
			}
		}
	} else {
		if fetchedSegments, fetchErr := FetchYouTubeTranscriptSegments(ctx, videoID); fetchErr == nil && len(fetchedSegments) > 0 {
			segments = fetchedSegments
			if oTitle, _ := FetchYouTubeMetadata(ctx, videoID); oTitle != "" {
				title = oTitle
			}
		}
	}

	// 2. Persist user message to SQLite
	if a.repo != nil {
		userMsgID := fmt.Sprintf("yt_msg_%d", time.Now().UnixNano())
		_ = a.repo.InsertYouTubeChatMessage(ctx, &database.YouTubeChatMessageRecord{
			ID:      userMsgID,
			VideoID: videoID,
			Role:    "user",
			Content: req.Query,
		})
	}

	// 3. Setup SSE Streaming
	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	// 4. Build Grounded Prompt
	promptMessages := llm.BuildYouTubeChatPrompt(title, segments, req.History, req.Query)

	var fullResponse strings.Builder

	// 5. Stream LLM tokens to client
	err := a.llmClient.GenerateStream(ctx, promptMessages, func(token string) error {
		fullResponse.WriteString(token)
		payload, _ := json.Marshal(map[string]string{"token": token})
		fmt.Fprintf(w, "data: %s\n\n", payload)
		flusher.Flush()
		return nil
	})

	if err != nil {
		errPayload, _ := json.Marshal(map[string]string{"error": err.Error()})
		fmt.Fprintf(w, "data: %s\n\n", errPayload)
		flusher.Flush()
		return
	}

	// 6. Persist assistant message to SQLite
	if a.repo != nil && fullResponse.Len() > 0 {
		aiMsgID := fmt.Sprintf("yt_msg_%d", time.Now().UnixNano())
		_ = a.repo.InsertYouTubeChatMessage(ctx, &database.YouTubeChatMessageRecord{
			ID:      aiMsgID,
			VideoID: videoID,
			Role:    "assistant",
			Content: fullResponse.String(),
		})
	}

	fmt.Fprintf(w, "data: [DONE]\n\n")
	flusher.Flush()
}

// HandleYouTubeChatHistory returns saved chat messages for a video.
func (a *API) HandleYouTubeChatHistory(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	videoID := r.URL.Query().Get("video_id")
	if videoID == "" {
		http.Error(w, "video_id parameter required", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	var list []database.YouTubeChatMessageRecord
	if a.repo != nil {
		msgs, err := a.repo.GetYouTubeChatMessages(ctx, videoID)
		if err == nil {
			list = msgs
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"video_id": videoID,
		"messages": list,
	})
}
