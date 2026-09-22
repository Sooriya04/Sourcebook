package agent

import (
	"bytes"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"sourcebook/internal/arxiv"
	"sourcebook/internal/utils"
)

// repairSources sends empty web source URLs to Searqon /scrape/batch,
// extracts arXiv papers directly via FetchSingleArxivDocument,
// and writes returned content back to SQLite.
func (s *Sentinel) repairSources(ctx context.Context, sources []emptySource) error {
	var webSources, redditSources, socialSources []emptySource
	repaired := 0

	for _, src := range sources {
		if arxiv.IsArxivURL(src.URL) {
			log.Printf("[Sentinel] Repairing arXiv source directly: %s", src.URL)
			_, content, err := arxiv.FetchSingleArxivDocument(ctx, src.URL)
			if err == nil && content != "" {
				if err := s.updateSourceContent(src.ID, content); err == nil {
					repaired++
				}
			} else {
				log.Printf("[Sentinel] ArXiv repair error for %s: %v", src.URL, err)
			}
		} else if utils.IsRedditURL(src.URL) {
			redditSources = append(redditSources, src)
		} else if utils.IsSocialURL(src.URL) {
			socialSources = append(socialSources, src)
		} else {
			webSources = append(webSources, src)
		}
	}

	// 1. Repair Reddit sources
	if len(redditSources) > 0 {
		redditUrls := make([]string, len(redditSources))
		redditMap := make(map[string]emptySource, len(redditSources))
		for i, src := range redditSources {
			redditUrls[i] = src.URL
			redditMap[src.URL] = src
		}
		log.Printf("[Sentinel] Repairing %d Reddit source(s)...", len(redditUrls))
		res, err := utils.ScrapeWithReddit(ctx, redditUrls)
		if err == nil {
			for _, item := range res {
				if item.Success && item.Markdown != "" {
					srcInfo := redditMap[item.URL]
					cleaned := utils.CleanText(item.Markdown)
					if cleaned != "" {
						if err := s.updateSourceContent(srcInfo.ID, cleaned); err == nil {
							repaired++
						}
					}
				}
			}
		}
	}

	// 2. Repair Social sources
	if len(socialSources) > 0 {
		socialUrls := make([]string, len(socialSources))
		socialMap := make(map[string]emptySource, len(socialSources))
		for i, src := range socialSources {
			socialUrls[i] = src.URL
			socialMap[src.URL] = src
		}
		log.Printf("[Sentinel] Repairing %d Social source(s)...", len(socialUrls))
		res, err := utils.ScrapeWithSocial(ctx, socialUrls)
		if err == nil {
			for _, item := range res {
				if item.Success && item.Markdown != "" {
					srcInfo := socialMap[item.URL]
					cleaned := utils.CleanText(item.Markdown)
					if cleaned != "" {
						if err := s.updateSourceContent(srcInfo.ID, cleaned); err == nil {
							repaired++
						}
					}
				}
			}
		}
	}

	if len(webSources) == 0 {
		log.Printf("[Sentinel] Repaired %d/%d source(s) (ArXiv/Reddit/Social only).", repaired, len(sources))
		return nil
	}

	repaired += s.repairWebSources(ctx, webSources)
	log.Printf("[Sentinel] Repaired %d/%d source(s) total.", repaired, len(sources))
	return nil
}

func (s *Sentinel) repairWebSources(ctx context.Context, webSources []emptySource) int {
	scrapeURL := os.Getenv("SEARQON_SCRAPE_URL")
	if scrapeURL == "" {
		scrapeURL = "http://127.0.0.1:4001/scrape/batch"
	}

	unresolved := make(map[string]emptySource, len(webSources))
	urls := make([]string, len(webSources))
	for i, src := range webSources {
		unresolved[src.URL] = src
		urls[i] = src.URL
	}

	body, err := json.Marshal(map[string]interface{}{
		"urls":   urls,
		"format": "markdown",
	})
	if err != nil {
		return 0
	}

	repaired := 0
	reqCtx, cancel := context.WithTimeout(ctx, 45*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, "POST", scrapeURL, bytes.NewBuffer(body))
	if err == nil {
		req.Header.Set("Content-Type", "application/json")
		client := &http.Client{Timeout: 45 * time.Second}
		resp, err := client.Do(req)
		if err == nil {
			defer resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				var result struct {
					Success bool `json:"success"`
					Data    []struct {
						URL      string `json:"url"`
						Markdown string `json:"markdown"`
						Content  string `json:"content"`
					} `json:"data"`
				}
				if err := json.NewDecoder(resp.Body).Decode(&result); err == nil && result.Success {
					for _, item := range result.Data {
						text := item.Markdown
						if text == "" {
							text = item.Content
						}
						text = strings.TrimSpace(text)
						if text == "" {
							continue
						}
						srcInfo, ok := unresolved[item.URL]
						if ok && s.updateSourceContent(srcInfo.ID, text) == nil {
							repaired++
							delete(unresolved, item.URL)
						}
					}
				}
			}
		}
	}

	// Fallback to Jina if still unresolved
	if len(unresolved) > 0 {
		var jinaUrls []string
		for u := range unresolved {
			jinaUrls = append(jinaUrls, u)
		}
		jinaResults, jinaErr := utils.ScrapeWithJina(ctx, jinaUrls)
		if jinaErr == nil {
			for _, item := range jinaResults {
				if item.Success && item.Markdown != "" {
					if srcInfo, ok := unresolved[item.URL]; ok {
						cleaned := utils.CleanText(item.Markdown)
						if cleaned != "" && s.updateSourceContent(srcInfo.ID, cleaned) == nil {
							repaired++
							delete(unresolved, item.URL)
						}
					}
				}
			}
		}
	}
	return repaired
}
