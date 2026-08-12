package utils

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strings"
	"time"
)

// IsRedditURL checks if a given URL is a Reddit URL.
func IsRedditURL(url string) bool {
	lower := strings.ToLower(url)
	return strings.Contains(lower, "reddit.com") || strings.Contains(lower, "redd.it")
}

type RedditScrapeResult struct {
	URL      string `json:"url"`
	Title    string `json:"title"`
	Markdown string `json:"markdown"`
	Success  bool   `json:"success"`
	Error    string `json:"error,omitempty"`
}

type RedditBatchResponse struct {
	Success bool                 `json:"success"`
	Data    []RedditScrapeResult `json:"data"`
}

// ScrapeWithReddit sends a batch of Reddit URLs to the local Reddit Ingestion Microservice on port 4004.
func ScrapeWithReddit(ctx context.Context, urls []string) ([]RedditScrapeResult, error) {
	redditServiceURL := os.Getenv("REDDIT_SERVICE_URL")
	if redditServiceURL == "" {
		redditServiceURL = "http://127.0.0.1:4004"
	}

	endpoint := fmt.Sprintf("%s/scrape/batch", redditServiceURL)

	reqPayload := map[string]interface{}{
		"urls": urls,
	}

	bodyBytes, err := json.Marshal(reqPayload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal reddit scrape request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create http request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 40 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http call to reddit microservice failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("reddit microservice returned non-200 status: %d", resp.StatusCode)
	}

	var respPayload RedditBatchResponse
	if err := json.NewDecoder(resp.Body).Decode(&respPayload); err != nil {
		return nil, fmt.Errorf("failed to decode reddit service response: %w", err)
	}

	return respPayload.Data, nil
}
