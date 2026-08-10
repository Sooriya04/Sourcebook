package agent

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
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
func (s *Sentinel) Trigger(ctx context.Context) {
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
		// Skip YouTube URLs — they're handled by the transcript service
		if strings.Contains(src.URL, "youtube.com") || strings.Contains(src.URL, "youtu.be") {
			continue
		}
		sources = append(sources, src)
	}
	return sources, rows.Err()
}

// repairSources sends the empty source URLs to Searqon /scrape/batch
// and writes returned content back to SQLite.
func (s *Sentinel) repairSources(ctx context.Context, sources []emptySource) error {
	scrapeURL := os.Getenv("SEARQON_SCRAPE_URL")
	if scrapeURL == "" {
		return fmt.Errorf("SEARQON_SCRAPE_URL not configured — cannot repair sources")
	}

	// Build URL list and URL→ID index
	urlToID := make(map[string]string, len(sources))
	urls := make([]string, 0, len(sources))
	for _, src := range sources {
		urls = append(urls, src.URL)
		urlToID[src.URL] = src.ID
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

	req, err := http.NewRequestWithContext(reqCtx, "POST", scrapeURL, bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("failed to build Searqon request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 45 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("Searqon unreachable: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		raw, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("Searqon returned status %d: %s", resp.StatusCode, string(raw))
	}

	var result struct {
		Success bool `json:"success"`
		Data    []struct {
			URL      string `json:"url"`
			Markdown string `json:"markdown"`
			Content  string `json:"content"`
		} `json:"data"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return fmt.Errorf("failed to decode Searqon response: %w", err)
	}

	if !result.Success {
		return fmt.Errorf("Searqon returned success=false")
	}

	repaired := 0
	for _, item := range result.Data {
		text := item.Markdown
		if text == "" {
			text = item.Content
		}
		text = strings.TrimSpace(text)
		if text == "" {
			log.Printf("[Sentinel] Empty content returned for %s — skipping", item.URL)
			continue
		}

		id, ok := urlToID[item.URL]
		if !ok {
			continue
		}

		if err := s.updateSourceContent(id, text); err != nil {
			log.Printf("[Sentinel] Failed to save content for %s: %v", item.URL, err)
		} else {
			repaired++
		}
	}

	log.Printf("[Sentinel] Repaired %d/%d source(s).", repaired, len(sources))
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
