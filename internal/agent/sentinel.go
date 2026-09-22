package agent

import (
	"context"
	"database/sql"
	"fmt"
	"log"
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
// repairs them by dispatching background scraping requests.
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
func (s *Sentinel) Trigger() {
	s.mu.Lock()
	if s.running {
		s.mu.Unlock()
		return
	}
	s.running = true
	s.mu.Unlock()

	go func() {
		defer func() {
			s.mu.Lock()
			s.running = false
			s.mu.Unlock()
		}()
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
		return
	}

	log.Printf("[Sentinel] Found %d empty source(s). Dispatching repair batch...", len(empty))
	if err := s.repairSources(ctx, empty); err != nil {
		log.Printf("[Sentinel] Repair cycle error: %v", err)
	}
}

// fetchEmptySources queries for sources with no content whose notebook exists.
func (s *Sentinel) fetchEmptySources() ([]emptySource, error) {
	query := `
		SELECT s.id, s.notebook_id, s.url
		FROM sources s
		INNER JOIN notebooks n ON s.notebook_id = n.id
		WHERE (s.content IS NULL OR s.content = '')
		  AND s.url != ''
		  AND s.url NOT LIKE '%youtube.com%'
		  AND s.url NOT LIKE '%youtu.be%'
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
			log.Printf("[Sentinel] Row scan error: %v", err)
			continue
		}
		sources = append(sources, src)
	}
	return sources, rows.Err()
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

// EmptyCount returns the number of sources with empty content, optionally notebook-scoped.
func (s *Sentinel) EmptyCount(notebookID string) int {
	var count int
	var err error
	if notebookID != "" {
		err = s.db.QueryRow(`
			SELECT COUNT(*)
			FROM sources s
			INNER JOIN notebooks n ON s.notebook_id = n.id
			WHERE s.notebook_id = ?
			  AND (s.content IS NULL OR s.content = '')
			  AND s.url != ''
			  AND s.url NOT LIKE '%youtube.com%'
			  AND s.url NOT LIKE '%youtu.be%'
		`, notebookID).Scan(&count)
	} else {
		err = s.db.QueryRow(`
			SELECT COUNT(*)
			FROM sources s
			INNER JOIN notebooks n ON s.notebook_id = n.id
			WHERE (s.content IS NULL OR s.content = '')
			  AND s.url != ''
			  AND s.url NOT LIKE '%youtube.com%'
			  AND s.url NOT LIKE '%youtu.be%'
		`).Scan(&count)
	}
	if err != nil {
		return 0
	}
	return count
}

// TotalCount returns the count of sources, optionally notebook-scoped.
func (s *Sentinel) TotalCount(notebookID string) int {
	var count int
	var err error
	if notebookID != "" {
		err = s.db.QueryRow(`SELECT COUNT(*) FROM sources WHERE notebook_id = ?`, notebookID).Scan(&count)
	} else {
		err = s.db.QueryRow(`SELECT COUNT(*) FROM sources s INNER JOIN notebooks n ON s.notebook_id = n.id`).Scan(&count)
	}
	if err != nil {
		return 0
	}
	return count
}
