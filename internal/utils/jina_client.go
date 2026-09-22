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

// ScrapeWithJina sends URLs to the local Jina service, falling back to public r.jina.ai if offline.
func ScrapeWithJina(ctx context.Context, urls []string) ([]JinaScrapeResult, error) {
	jinaServiceURL := os.Getenv("JINA_SERVICE_URL")
	if jinaServiceURL == "" {
		jinaServiceURL = "http://127.0.0.1:4003"
	}

	endpoint := fmt.Sprintf("%s/scrape/batch", jinaServiceURL)
	reqPayload := map[string]interface{}{"urls": urls}
	bodyBytes, err := json.Marshal(reqPayload)
	if err == nil {
		req, reqErr := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBuffer(bodyBytes))
		if reqErr == nil {
			req.Header.Set("Content-Type", "application/json")
			client := &http.Client{Timeout: 30 * time.Second}
			resp, doErr := client.Do(req)
			if doErr == nil && resp.StatusCode == http.StatusOK {
				defer resp.Body.Close()
				var respPayload JinaBatchResponse
				if decodeErr := json.NewDecoder(resp.Body).Decode(&respPayload); decodeErr == nil && respPayload.Success {
					return respPayload.Data, nil
				}
			}
		}
	}

	// Fallback to public r.jina.ai reader
	return fetchViaPublicJina(ctx, urls)
}

func fetchViaPublicJina(ctx context.Context, urls []string) ([]JinaScrapeResult, error) {
	var results []JinaScrapeResult
	httpClient := &http.Client{Timeout: 12 * time.Second}

	for _, u := range urls {
		rURL := fmt.Sprintf("https://r.jina.ai/%s", u)
		req, err := http.NewRequestWithContext(ctx, "GET", rURL, nil)
		if err != nil {
			continue
		}
		req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
		resp, err := httpClient.Do(req)
		if err == nil && resp.StatusCode == http.StatusOK {
			buf := new(bytes.Buffer)
			buf.ReadFrom(resp.Body)
			resp.Body.Close()
			md := buf.String()
			if len(md) > 50 {
				results = append(results, JinaScrapeResult{
					URL:      u,
					Markdown: md,
					Success:  true,
				})
			}
		}
	}

	if len(results) > 0 {
		return results, nil
	}
	return nil, fmt.Errorf("unable to scrape URLs via local or public Jina")
}
