package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sourcebook/internal/synthesis"
	"sourcebook/internal/utils"
	"time"
)

type CrawlRequest struct {
	URL   string `json:"url"`
	Limit int    `json:"limit,omitempty"`
	Depth int    `json:"depth,omitempty"`
}

type CrawlPage struct {
	Title    string `json:"title"`
	URL      string `json:"url"`
	Markdown string `json:"markdown"`
	Content  string `json:"content"`
}

type SearqonCrawlResponse struct {
	Success bool `json:"success"`
	Data    struct {
		SourceURL string      `json:"sourceUrl"`
		Pages     []CrawlPage `json:"pages"`
		Total     int         `json:"total"`
	} `json:"data"`
}

func (a *API) HandleCrawl(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CrawlRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.URL == "" {
		http.Error(w, "url is required", http.StatusBadRequest)
		return
	}

	limit := req.Limit
	if limit <= 0 {
		limit = 5
	}
	depth := req.Depth
	if depth <= 0 {
		depth = 1
	}

	searqonURL := os.Getenv("SEARQON_URL")
	if searqonURL == "" {
		searqonURL = "http://localhost:4001"
	}

	crawlEndpoint := fmt.Sprintf("%s/crawl", searqonURL)
	payload, _ := json.Marshal(map[string]interface{}{
		"url":    req.URL,
		"limit":  limit,
		"depth":  depth,
		"format": "markdown",
	})

	httpReq, err := http.NewRequestWithContext(r.Context(), "POST", crawlEndpoint, bytes.NewBuffer(payload))
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to create request: %v", err), http.StatusInternalServerError)
		return
	}
	httpReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 90 * time.Second}
	resp, err := client.Do(httpReq)
	if err != nil {
		http.Error(w, fmt.Sprintf("Searqon crawl request failed: %v", err), http.StatusInternalServerError)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		http.Error(w, fmt.Sprintf("Searqon returned error %d: %s", resp.StatusCode, string(bodyBytes)), resp.StatusCode)
		return
	}

	var searqonResp SearqonCrawlResponse
	if err := json.NewDecoder(resp.Body).Decode(&searqonResp); err != nil {
		http.Error(w, fmt.Sprintf("failed to decode response: %v", err), http.StatusInternalServerError)
		return
	}

	var docs []synthesis.ScrapedDoc
	for _, p := range searqonResp.Data.Pages {
		text := p.Markdown
		if text == "" {
			text = p.Content
		}
		text = utils.CleanText(text)
		if text != "" {
			docs = append(docs, synthesis.ScrapedDoc{
				Title:   p.Title,
				URL:     p.URL,
				Content: text,
			})
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"source_url": req.URL,
		"total":      len(docs),
		"documents":  docs,
	})
}
