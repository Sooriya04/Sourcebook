package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sourcebook/internal/models"
	"sourcebook/internal/synthesis"
	"sourcebook/internal/utils"
	"time"
)

type YouTubeSearchResult struct {
	VideoID    string `json:"video_id"`
	Title      string `json:"title"`
	URL        string `json:"url"`
	Status     string `json:"status"`
	Transcript string `json:"transcript"`
}

type YouTubeSearchResponse struct {
	Query   string                `json:"query"`
	Count   int                   `json:"count"`
	Results []YouTubeSearchResult `json:"results"`
}

func FetchYouTubeTranscripts(ctx context.Context, query string, maxVideo int) ([]synthesis.ScrapedDoc, error) {
	youtubeURL := os.Getenv("YOUTUBE_SERVICE_URL")
	if youtubeURL == "" {
		youtubeURL = "http://localhost:6001" // Fallback if not strictly enforced here
	}

	reqBody, _ := json.Marshal(map[string]interface{}{
		"query":     query,
		"max_video": maxVideo,
	})

	endpoint := fmt.Sprintf("%s/youtube/search", youtubeURL)
	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create youtube request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("youtube service request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("youtube service returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var data YouTubeSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to decode youtube response: %w", err)
	}

	var docs []synthesis.ScrapedDoc
	for _, res := range data.Results {
		if res.Transcript != "" && res.Transcript != "None" {
			cleanText := utils.CleanText(res.Transcript)
			if cleanText != "" {
				docs = append(docs, synthesis.ScrapedDoc{
					Title:   res.Title,
					URL:     res.URL,
					Content: cleanText,
				})
			}
		}
	}

	return docs, nil
}

func DiscoverYouTubeMetadata(ctx context.Context, query string, maxVideo int) ([]models.SearchResult, error) {
	youtubeURL := os.Getenv("YOUTUBE_SERVICE_URL")
	if youtubeURL == "" {
		youtubeURL = "http://localhost:6001"
	}

	reqBody, _ := json.Marshal(map[string]interface{}{
		"query":     query,
		"max_video": maxVideo,
	})

	endpoint := fmt.Sprintf("%s/youtube/discover", youtubeURL)
	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create youtube discover request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second} // Fast timeout for discovery
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("youtube discover request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("youtube discover returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var data YouTubeSearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to decode youtube discover response: %w", err)
	}

	var results []models.SearchResult
	for _, res := range data.Results {
		if res.URL != "" && res.Title != "" {
			results = append(results, models.SearchResult{
				ID:      fmt.Sprintf("yt-%s", res.VideoID),
				Title:   res.Title,
				URL:     res.URL,
				Snippet: "YouTube Video",
				Source:  "YouTube",
			})
		}
	}

	return results, nil
}

func FetchSingleYouTubeTranscript(ctx context.Context, url string) (string, error) {
	youtubeURL := os.Getenv("YOUTUBE_SERVICE_URL")
	if youtubeURL == "" {
		youtubeURL = "http://localhost:6001"
	}

	reqBody, _ := json.Marshal(map[string]interface{}{
		"url": url,
	})

	endpoint := fmt.Sprintf("%s/youtube/transcript", youtubeURL)
	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBuffer(reqBody))
	if err != nil {
		return "", fmt.Errorf("failed to create youtube transcript request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("youtube transcript request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("youtube transcript returned status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	var data struct {
		Text string `json:"text"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return "", fmt.Errorf("failed to decode youtube transcript response: %w", err)
	}

	return data.Text, nil
}

// FetchYouTubeTitle attempts to fetch the real title of a YouTube video via YouTube's public oEmbed API.
func FetchYouTubeTitle(ctx context.Context, videoURL string) string {
	oembedURL := fmt.Sprintf("https://www.youtube.com/oembed?url=%s&format=json", videoURL)
	req, err := http.NewRequestWithContext(ctx, "GET", oembedURL, nil)
	if err != nil {
		return "YouTube Video"
	}
	client := &http.Client{Timeout: 3 * time.Second}
	resp, err := client.Do(req)
	if err != nil || resp.StatusCode != http.StatusOK {
		return "YouTube Video"
	}
	defer resp.Body.Close()

	var data struct {
		Title string `json:"title"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err == nil && data.Title != "" {
		return data.Title
	}
	return "YouTube Video"
}
