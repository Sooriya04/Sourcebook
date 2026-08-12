package utils

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"time"
)

type JinaScrapeResult struct {
	URL      string `json:"url"`
	Title    string `json:"title"`
	Markdown string `json:"markdown"`
	Success  bool   `json:"success"`
	Error    string `json:"error,omitempty"`
}

type JinaBatchResponse struct {
	Success bool               `json:"success"`
	Data    []JinaScrapeResult `json:"data"`
}

// ScrapeWithJina sends a batch of URLs to the local Jina Ingestion Microservice.
func ScrapeWithJina(ctx context.Context, urls []string) ([]JinaScrapeResult, error) {
	jinaServiceURL := os.Getenv("JINA_SERVICE_URL")
	if jinaServiceURL == "" {
		jinaServiceURL = "http://127.0.0.1:4003"
	}

	endpoint := fmt.Sprintf("%s/scrape/batch", jinaServiceURL)

	reqPayload := map[string]interface{}{
		"urls": urls,
	}

	bodyBytes, err := json.Marshal(reqPayload)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal jina scrape request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create http request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 40 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("http call to jina microservice failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("jina microservice returned non-200 status: %d", resp.StatusCode)
	}

	var respPayload JinaBatchResponse
	if err := json.NewDecoder(resp.Body).Decode(&respPayload); err != nil {
		return nil, fmt.Errorf("failed to decode jina service response: %w", err)
	}

	return respPayload.Data, nil
}
