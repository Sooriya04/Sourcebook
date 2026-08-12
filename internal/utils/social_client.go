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

type SocialScrapeResult struct {
	URL      string `json:"url"`
	Title    string `json:"title"`
	Markdown string `json:"markdown"`
	Success  bool   `json:"success"`
	Error    string `json:"error,omitempty"`
}

type SocialBatchResponse struct {
	Success bool                 `json:"success"`
	Data    []SocialScrapeResult `json:"data"`
}

// IsSocialURL checks if the URL is handled by the social ingestion microservice (RSS, WeChat, Weibo, Bilibili, Facebook, LinkedIn).
func IsSocialURL(url string) bool {
	lower := strings.ToLower(url)

	// RSS/Atom check
	isFeed := strings.HasSuffix(lower, ".xml") ||
		strings.HasSuffix(lower, ".rss") ||
		strings.Contains(lower, "/feed") ||
		strings.Contains(lower, "/rss") ||
		strings.Contains(lower, "atom")

	// Social platforms check
	isPlatform := strings.Contains(lower, "weixin.qq.com") ||
		strings.Contains(lower, "weibo.com") ||
		strings.Contains(lower, "weibo.cn") ||
		strings.Contains(lower, "bilibili.com") ||
		strings.Contains(lower, "b23.tv") ||
		strings.Contains(lower, "facebook.com") ||
		strings.Contains(lower, "fb.com") ||
		strings.Contains(lower, "fb.watch") ||
		strings.Contains(lower, "linkedin.com")

	return isFeed || isPlatform
}

// ScrapeWithSocial sends a batch of social URLs to the local Social Ingestion Microservice on port 4005.
func ScrapeWithSocial(ctx context.Context, urls []string) ([]SocialScrapeResult, error) {
	socialServiceURL := os.Getenv("SOCIAL_SERVICE_URL")
	if socialServiceURL == "" {
		socialServiceURL = "http://127.0.0.1:4005"
	}

	endpoint := fmt.Sprintf("%s/scrape/batch", socialServiceURL)

	reqPayload := map[string]interface{}{
		"urls": urls,
	}

	bodyBytes, err := json.Marshal(reqPayload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal social scrape request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create http request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 40 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http call to social microservice failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("social microservice returned non-200 status: %d", resp.StatusCode)
	}

	var respPayload SocialBatchResponse
	if err := json.NewDecoder(resp.Body).Decode(&respPayload); err != nil {
		return nil, fmt.Errorf("failed to decode social service response: %w", err)
	}

	return respPayload.Data, nil
}
