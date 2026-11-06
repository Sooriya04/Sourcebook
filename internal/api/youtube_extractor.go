package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"regexp"
	"sourcebook/internal/models"
	"strings"
	"time"
)

var ytIDRegex = regexp.MustCompile(`(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})`)

// ExtractYouTubeID parses an 11-char video ID from any URL or raw ID string.
func ExtractYouTubeID(raw string) string {
	raw = strings.TrimSpace(raw)
	if m := ytIDRegex.FindStringSubmatch(raw); len(m) > 1 {
		return m[1]
	}
	if len(raw) == 11 && regexp.MustCompile(`^[\w-]{11}$`).MatchString(raw) {
		return raw
	}
	return ""
}

// FormatSecondsToTimestamp converts seconds into mm:ss or hh:mm:ss string.
func FormatSecondsToTimestamp(secs float64) string {
	totalSecs := int(secs)
	hours := totalSecs / 3600
	minutes := (totalSecs % 3600) / 60
	seconds := totalSecs % 60
	if hours > 0 {
		return fmt.Sprintf("%02d:%02d:%02d", hours, minutes, seconds)
	}
	return fmt.Sprintf("%02d:%02d", minutes, seconds)
}

// FetchYouTubeMetadata calls YouTube's oEmbed API for video title and author.
func FetchYouTubeMetadata(ctx context.Context, videoID string) (title, author string) {
	videoURL := fmt.Sprintf("https://www.youtube.com/watch?v=%s", videoID)
	oembedURL := fmt.Sprintf("https://www.youtube.com/oembed?url=%s&format=json", videoURL)

	req, err := http.NewRequestWithContext(ctx, "GET", oembedURL, nil)
	if err != nil {
		return "YouTube Video", "YouTube"
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		return "YouTube Video", "YouTube"
	}
	defer resp.Body.Close()

	var data struct {
		Title      string `json:"title"`
		AuthorName string `json:"author_name"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err == nil {
		if data.Title != "" {
			title = data.Title
		}
		if data.AuthorName != "" {
			author = data.AuthorName
		}
	}
	if title == "" {
		title = "YouTube Video"
	}
	if author == "" {
		author = "YouTube"
	}
	return title, author
}

// FetchYouTubeTranscriptSegments calls local python script to fetch full segment array.
func FetchYouTubeTranscriptSegments(ctx context.Context, videoID string) ([]models.YouTubeSegment, error) {
	pythonBin := ".venv/bin/python"
	if _, err := os.Stat(pythonBin); err != nil {
		pythonBin = "python3"
	}

	pyScript := `
import sys, json
sys.path.append("services/youtube")
from services.transcript import TranscriptService
try:
    res = TranscriptService.fetch(sys.argv[1])
    print(json.dumps({"success": True, "transcript": res.get("transcript", [])}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`
	videoURL := fmt.Sprintf("https://www.youtube.com/watch?v=%s", videoID)
	cmd := exec.CommandContext(ctx, pythonBin, "-c", pyScript, videoURL)
	output, err := cmd.Output()
	if err != nil {
		return nil, fmt.Errorf("transcript execution failed: %w", err)
	}

	var data struct {
		Success    bool `json:"success"`
		Transcript []struct {
			Text     string  `json:"text"`
			Start    float64 `json:"start"`
			Duration float64 `json:"duration"`
		} `json:"transcript"`
		Error string `json:"error"`
	}

	if err := json.Unmarshal(output, &data); err != nil {
		return nil, fmt.Errorf("failed to decode transcript output: %w", err)
	}

	if !data.Success {
		return nil, fmt.Errorf("transcript error: %s", data.Error)
	}

	var segments []models.YouTubeSegment
	for _, item := range data.Transcript {
		cleanTxt := strings.TrimSpace(item.Text)
		if cleanTxt != "" {
			segments = append(segments, models.YouTubeSegment{
				Start:     item.Start,
				Duration:  item.Duration,
				Timestamp: FormatSecondsToTimestamp(item.Start),
				Text:      cleanTxt,
			})
		}
	}

	return segments, nil
}
