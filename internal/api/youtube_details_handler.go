package api

import (
	"encoding/json"
	"net/http"
	"sourcebook/internal/database"
	"sourcebook/internal/models"
	"strings"
)

// HandleYouTubeDetails retrieves or extracts video metadata, chapters, and segments.
func (a *API) HandleYouTubeDetails(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		URL     string `json:"url"`
		VideoID string `json:"video_id"`
		Title   string `json:"title"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON body", http.StatusBadRequest)
		return
	}

	videoID := req.VideoID
	if videoID == "" && req.URL != "" {
		videoID = ExtractYouTubeID(req.URL)
	}
	if videoID == "" {
		http.Error(w, "Valid 'video_id' or 'url' is required", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	customTitle := strings.TrimSpace(req.Title)

	// 1. Check local SQLite cache first (zero redundant network calls)
	var cached *database.YouTubeVideoRecord
	if a.repo != nil {
		cached, _ = a.repo.GetYouTubeVideo(ctx, videoID)
		if cached != nil && cached.SegmentsJSON != "" {
			if customTitle != "" && customTitle != cached.Title {
				cached.Title = customTitle
				_ = a.repo.UpsertYouTubeVideo(ctx, cached)
			}
			var chaps []models.YouTubeChapter
			var segs []models.YouTubeSegment
			_ = json.Unmarshal([]byte(cached.ChaptersJSON), &chaps)
			_ = json.Unmarshal([]byte(cached.SegmentsJSON), &segs)

			durStr := FormatSecondsToTimestamp(float64(cached.DurationSeconds))
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(models.YouTubeVideoDetails{
				VideoID:         cached.VideoID,
				Title:           cached.Title,
				Channel:         cached.Channel,
				Duration:        durStr,
				DurationSeconds: cached.DurationSeconds,
				Chapters:        chaps,
				Segments:        segs,
				Status:          cached.Status,
			})
			return
		}
	}

	// 2. Resolve Title & Channel via public oEmbed
	title, channel := FetchYouTubeMetadata(ctx, videoID)
	if customTitle != "" {
		title = customTitle
	}

	// 3. Extract Transcript Segments via python bridge
	segments, err := FetchYouTubeTranscriptSegments(ctx, videoID)
	status := "synced"
	if err != nil || len(segments) == 0 {
		status = "no_transcript"
		segments = []models.YouTubeSegment{}
	}

	// Calculate approximate duration and synthesize chapters if needed
	var maxSecs float64
	for _, s := range segments {
		end := s.Start + s.Duration
		if end > maxSecs {
			maxSecs = end
		}
	}
	durSeconds := int(maxSecs)
	// ponytail: ceiling is fallback to cached db duration when transcript segment parsing yields empty segments; upgrade path is full multi-source duration extraction.
	if durSeconds == 0 && cached != nil && cached.DurationSeconds > 0 {
		durSeconds = cached.DurationSeconds
		maxSecs = float64(cached.DurationSeconds)
	}
	durFormatted := FormatSecondsToTimestamp(maxSecs)

	chapters := generateSynthesizedChapters(segments, maxSecs)

	// 4. Save to SQLite cache
	if a.repo != nil {
		chapsBytes, _ := json.Marshal(chapters)
		segsBytes, _ := json.Marshal(segments)
		_ = a.repo.UpsertYouTubeVideo(ctx, &database.YouTubeVideoRecord{
			VideoID:         videoID,
			Title:           title,
			Channel:         channel,
			DurationSeconds: durSeconds,
			ChaptersJSON:    string(chapsBytes),
			SegmentsJSON:    string(segsBytes),
			Status:          status,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(models.YouTubeVideoDetails{
		VideoID:         videoID,
		Title:           title,
		Channel:         channel,
		Duration:        durFormatted,
		DurationSeconds: durSeconds,
		Chapters:        chapters,
		Segments:        segments,
		Status:          status,
	})
}

// generateSynthesizedChapters clusters transcript segments into 3-4 minute semantic blocks.
func generateSynthesizedChapters(segments []models.YouTubeSegment, totalSecs float64) []models.YouTubeChapter {
	if len(segments) == 0 {
		return []models.YouTubeChapter{}
	}

	step := 180.0 // 3 minutes per chapter bucket
	if totalSecs > 1800 {
		step = 300.0 // 5 minutes for longer videos
	}

	var chapters []models.YouTubeChapter
	currentBucket := 0.0

	for _, s := range segments {
		if len(chapters) == 0 || s.Start >= currentBucket+step {
			currentBucket = s.Start
			cleanTitle := strings.TrimSpace(s.Text)
			if len(cleanTitle) > 42 {
				cleanTitle = cleanTitle[:42] + "..."
			}
			if len(chapters) == 0 {
				cleanTitle = "Introduction"
			}
			chapters = append(chapters, models.YouTubeChapter{
				Title:     cleanTitle,
				Start:     s.Start,
				Timestamp: s.Timestamp,
			})
		}
	}
	return chapters
}
