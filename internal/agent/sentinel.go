package agent

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"sourcebook/internal/arxiv"
	"sourcebook/internal/utils"
)

// emptySource is a lightweight record for sources that need scraping.
type emptySource struct {
	ID         string
	NotebookID string
	URL        string
}

// Sentinel monitors for sources with empty content and opportunistically
// repairs them by dispatching a single Searqon /scrape/batch request.
// It is triggered by search activity — no polling loop.
type Sentinel struct {
	db        *sql.DB
	batchSize int

	mu      sync.Mutex
	running bool
}

// NewSentinel creates a new Sentinel tied to the given database.
func NewSentinel(db *sql.DB) *Sentinel {
	return &Sentinel{
		db:        db,
		batchSize: 10,
	}
}

// Trigger starts one background repair cycle if none is currently running.
// Safe to call from multiple goroutines / concurrent search requests.
func (s *Sentinel) Trigger() {
	s.mu.Lock()
	if s.running {
		s.mu.Unlock()
		return // Another cycle is already in progress — skip
	}
	s.running = true
	s.mu.Unlock()

	go func() {
		defer func() {
			s.mu.Lock()
			s.running = false
			s.mu.Unlock()
		}()
		// Use background context so HTTP request cancellation does not abort Sentinel repair
		ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
		defer cancel()
		s.runOnce(ctx)
	}()
}

// runOnce performs a single scan-and-repair cycle and then stops.
func (s *Sentinel) runOnce(ctx context.Context) {
	empty, err := s.fetchEmptySources()
	if err != nil {
		log.Printf("[Sentinel] Failed to query empty sources: %v", err)
		return
	}

	if len(empty) == 0 {
		return // All sources healthy — nothing to do
	}

	log.Printf("[Sentinel] Found %d empty source(s). Dispatching Searqon repair batch...", len(empty))

	if err := s.repairSources(ctx, empty); err != nil {
		log.Printf("[Sentinel] Repair cycle error: %v", err)
	}
}

// fetchEmptySources queries for sources with no content.
func (s *Sentinel) fetchEmptySources() ([]emptySource, error) {
	query := `
		SELECT id, notebook_id, url
		FROM sources
		WHERE (content IS NULL OR content = '')
		  AND url != ''
		  AND url NOT LIKE '%youtube.com%'
		  AND url NOT LIKE '%youtu.be%'
		LIMIT ?`

	rows, err := s.db.Query(query, s.batchSize)
	if err != nil {
		return nil, fmt.Errorf("query failed: %w", err)
	}
	defer rows.Close()

	var sources []emptySource
	for rows.Next() {
		var src emptySource
		if err := rows.Scan(&src.ID, &src.NotebookID, &src.URL); err != nil {
			continue
		}
		sources = append(sources, src)
	}
	return sources, rows.Err()
}

// repairSources sends empty web source URLs to Searqon /scrape/batch,
// extracts arXiv papers directly via FetchSingleArxivDocument,
// and writes returned content back to SQLite.
func (s *Sentinel) repairSources(ctx context.Context, sources []emptySource) error {
	var webSources []emptySource
	var redditSources []emptySource
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
		} else {
			webSources = append(webSources, src)
		}
	}

	// 1. Repair Reddit sources
	if len(redditSources) > 0 {
		var redditUrls []string
		redditMap := make(map[string]emptySource, len(redditSources))
		for _, src := range redditSources {
			redditUrls = append(redditUrls, src.URL)
			redditMap[src.URL] = src
		}
		log.Printf("[Sentinel] Repairing %d Reddit source(s) via Reddit Microservice...", len(redditUrls))
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
				} else {
					log.Printf("[Sentinel] Reddit scrape failed for %s: %s", item.URL, item.Error)
				}
			}
		} else {
			log.Printf("[Sentinel] Reddit microservice error: %v", err)
		}
	}

	if len(webSources) == 0 {
		log.Printf("[Sentinel] Repaired %d/%d source(s) (ArXiv/Reddit only).", repaired, len(sources))
		return nil
	}

	scrapeURL := os.Getenv("SEARQON_SCRAPE_URL")
	if scrapeURL == "" {
		scrapeURL = "http://127.0.0.1:4001/scrape/batch"
	}

	// Build unresolved map
	unresolved := make(map[string]emptySource, len(webSources))
	for _, src := range webSources {
		unresolved[src.URL] = src
	}

	// Build URL list and URL→ID index
	urls := make([]string, 0, len(webSources))
	for _, src := range webSources {
		urls = append(urls, src.URL)
	}

	body, err := json.Marshal(map[string]interface{}{
		"urls":   urls,
		"format": "markdown",
	})
	if err != nil {
		return fmt.Errorf("failed to marshal scrape request: %w", err)
	}

	// 45-second timeout — same as pipeline_handler.go
	reqCtx, cancel := context.WithTimeout(ctx, 45*time.Second)
	defer cancel()

	var searqonSuccess bool
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
					searqonSuccess = true
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
						if !ok {
							continue
						}
						if err := s.updateSourceContent(srcInfo.ID, text); err == nil {
							repaired++
							delete(unresolved, item.URL)
						}
					}
				}
			}
		}
	}

	// If there are still unresolved URLs, fall back to Jina Ingestion Microservice
	if len(unresolved) > 0 {
		var jinaUrls []string
		for u := range unresolved {
			jinaUrls = append(jinaUrls, u)
		}
		log.Printf("[Sentinel] Searqon did not resolve all web sources (success=%t). Dispatching Jina AI fallback for %d URL(s)...", searqonSuccess, len(jinaUrls))
		jinaResults, jinaErr := utils.ScrapeWithJina(ctx, jinaUrls)
		if jinaErr == nil {
			for _, item := range jinaResults {
				if item.Success && item.Markdown != "" {
					srcInfo, ok := unresolved[item.URL]
					if ok {
						cleaned := utils.CleanText(item.Markdown)
						if cleaned != "" {
							if err := s.updateSourceContent(srcInfo.ID, cleaned); err == nil {
								repaired++
								delete(unresolved, item.URL)
							}
						}
					}
				}
			}
		} else {
			log.Printf("[Sentinel] Fallback Jina AI scrape failed: %v", jinaErr)
		}
	}

	log.Printf("[Sentinel] Repaired %d/%d source(s) total.", repaired, len(sources))
	return nil
}

// updateSourceContent writes scraped content back to the sources row.
func (s *Sentinel) updateSourceContent(id, content string) error {
	_, err := s.db.Exec(
		`UPDATE sources SET content = ?, updated_at = ? WHERE id = ?`,
		content, time.Now().UTC(), id,
	)
	return err
}

// Running returns if the sentinel is currently active.
func (s *Sentinel) Running() bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.running
}

// EmptyCount returns the number of sources with empty content.
func (s *Sentinel) EmptyCount() int {
	var count int
	err := s.db.QueryRow(`
		SELECT COUNT(*)
		FROM sources
		WHERE (content IS NULL OR content = '')
		  AND url != ''
		  AND url NOT LIKE '%youtube.com%'
		  AND url NOT LIKE '%youtu.be%'
	`).Scan(&count)
	if err != nil {
		return 0
	}
	return count
}
