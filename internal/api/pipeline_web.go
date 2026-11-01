package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"sourcebook/internal/models"
	"sourcebook/internal/synthesis"
	"sourcebook/internal/utils"
)

func (a *API) scrapeWebURLs(ctx context.Context, webUrls []string) ([]synthesis.ScrapedDoc, []byte) {
	if len(webUrls) == 0 {
		return nil, []byte(`{"success":true,"data":[]}`)
	}

	settings, _ := a.repo.GetSettings()
	if settings != nil && settings.DeepCrawlEnabled {
		return a.crawlWebURLs(ctx, webUrls, settings)
	}
	return a.batchScrapeWebURLs(ctx, webUrls)
}

func (a *API) crawlWebURLs(ctx context.Context, webUrls []string, settings *models.UserSettings) ([]synthesis.ScrapedDoc, []byte) {
	searqonURL := os.Getenv("SEARQON_URL")
	if searqonURL == "" {
		searqonURL = "http://localhost:4001"
	}
	log.Printf("[Pipeline] Deep Crawl Enabled! Crawling sub-URLs for %d sources via %s", len(webUrls), searqonURL)

	limit, depth := 5, 1
	if settings != nil {
		if settings.DeepCrawlLimit > 0 {
			limit = settings.DeepCrawlLimit
		}
		if settings.DeepCrawlDepth > 0 {
			depth = settings.DeepCrawlDepth
		}
	}

	client := &http.Client{Timeout: 30 * time.Second}
	var docs []synthesis.ScrapedDoc
	var mu sync.Mutex
	var crawlWg sync.WaitGroup

	for _, webURL := range webUrls {
		crawlWg.Add(1)
		go func(u string) {
			defer crawlWg.Done()
			endpoint := fmt.Sprintf("%s/crawl", searqonURL)
			reqBody, _ := json.Marshal(map[string]interface{}{"url": u, "limit": limit, "depth": depth, "format": "markdown"})
			req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBuffer(reqBody))
			if err != nil {
				return
			}
			req.Header.Set("Content-Type", "application/json")
			resp, err := client.Do(req)
			if err != nil || resp.StatusCode != http.StatusOK {
				if resp != nil {
					resp.Body.Close()
				}
				return
			}
			defer resp.Body.Close()

			var crawlData struct {
				Success bool `json:"success"`
				Data    struct {
					Pages []struct {
						Title    string `json:"title"`
						URL      string `json:"url"`
						Markdown string `json:"markdown"`
						Content  string `json:"content"`
					} `json:"pages"`
				} `json:"data"`
			}
			if err := json.NewDecoder(resp.Body).Decode(&crawlData); err == nil && crawlData.Success {
				mu.Lock()
				for _, p := range crawlData.Data.Pages {
					text := utils.CleanText(p.Markdown)
					if text == "" {
						text = utils.CleanText(p.Content)
					}
					if text != "" {
						docs = append(docs, synthesis.ScrapedDoc{Title: p.Title, URL: p.URL, Content: text})
					}
				}
				mu.Unlock()
			}
		}(webURL)
	}
	crawlWg.Wait()
	return docs, []byte(`{"success":true,"data":[]}`)
}

func (a *API) batchScrapeWebURLs(ctx context.Context, webUrls []string) ([]synthesis.ScrapedDoc, []byte) {
	unresolved := make(map[string]bool, len(webUrls))
	for _, u := range webUrls {
		unresolved[u] = true
	}

	searqonURL := ""
	if a.repo != nil {
		if s, err := a.repo.GetSettings(); err == nil && s.SearqonURL != "" {
			searqonURL = s.SearqonURL
		}
	}
	if searqonURL == "" {
		searqonURL = os.Getenv("SEARQON_SCRAPE_URL")
	}
	if searqonURL == "" {
		searqonURL = "http://127.0.0.1:4001/scrape/batch"
	}

	var docs []synthesis.ScrapedDoc
	var respBody []byte
	batchBody, _ := json.Marshal(map[string]interface{}{"urls": webUrls, "format": "markdown"})
	searqonReq, err := http.NewRequestWithContext(ctx, "POST", searqonURL, bytes.NewBuffer(batchBody))
	if err == nil {
		searqonReq.Header.Set("Content-Type", "application/json")
		client := &http.Client{Timeout: 45 * time.Second}
		if resp, err := client.Do(searqonReq); err == nil {
			defer resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				if bodyBytes, err := io.ReadAll(resp.Body); err == nil {
					respBody = bodyBytes
					var data struct {
						Success bool `json:"success"`
						Data    []struct {
							Title    string `json:"title"`
							URL      string `json:"url"`
							Markdown string `json:"markdown"`
							Content  string `json:"content"`
						} `json:"data"`
					}
					if err := json.Unmarshal(bodyBytes, &data); err == nil && data.Success {
						for _, item := range data.Data {
							text := utils.CleanText(item.Markdown)
							if text == "" {
								text = utils.CleanText(item.Content)
							}
							if text != "" {
								docs = append(docs, synthesis.ScrapedDoc{Title: item.Title, URL: item.URL, Content: text})
								delete(unresolved, item.URL)
							}
						}
					}
				}
			}
		}
	}

	if len(unresolved) > 0 {
		var jinaUrls []string
		for u := range unresolved {
			jinaUrls = append(jinaUrls, u)
		}
		if jResults, jErr := utils.ScrapeWithJina(ctx, jinaUrls); jErr == nil {
			for _, item := range jResults {
				if item.Success && item.Markdown != "" {
					if text := utils.CleanText(item.Markdown); text != "" {
						docs = append(docs, synthesis.ScrapedDoc{Title: item.Title, URL: item.URL, Content: text})
					}
				}
			}
		}
	}

	if respBody == nil {
		respBody = []byte(`{"success":true,"data":[]}`)
	}
	return docs, respBody
}
