package agent

import (
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	_ "github.com/mattn/go-sqlite3"
)

func TestSentinel_FailingURLMarkedFailedAndNotRequeued(t *testing.T) {
	// Scraper returns empty results indicating scraping failure
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		resp := map[string]interface{}{
			"success": true,
			"data": []map[string]interface{}{
				{
					"url":      "https://dead-link.com/404",
					"markdown": "",
					"success":  false,
				},
			},
		}
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	t.Setenv("SEARQON_SCRAPE_URL", server.URL)
	t.Setenv("JINA_SERVICE_URL", server.URL)

	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("failed to open sqlite: %v", err)
	}
	defer db.Close()

	_, err = db.Exec(`
		CREATE TABLE notebooks (id TEXT PRIMARY KEY, title TEXT);
		CREATE TABLE sources (id TEXT PRIMARY KEY, notebook_id TEXT, url TEXT, content TEXT, updated_at DATETIME);
		INSERT INTO notebooks (id, title) VALUES ('nb1', 'Test NB');
		INSERT INTO sources (id, notebook_id, url, content) VALUES ('src-fail', 'nb1', 'https://dead-link.com/404', '');
	`)
	if err != nil {
		t.Fatalf("failed to create tables: %v", err)
	}

	sentinel := NewSentinel(db)

	// Run sentinel once
	sentinel.runOnce(context.Background())

	// Verify the failing source was marked with "[Scrape failed]"
	var content string
	if err := db.QueryRow(`SELECT content FROM sources WHERE id = 'src-fail'`).Scan(&content); err != nil {
		t.Fatalf("failed to query source: %v", err)
	}
	if content != "[Scrape failed]" {
		t.Fatalf("expected content '[Scrape failed]', got %q", content)
	}

	// Verify next fetchEmptySources does not return this source
	empty, err := sentinel.fetchEmptySources()
	if err != nil {
		t.Fatalf("fetchEmptySources failed: %v", err)
	}
	if len(empty) != 0 {
		t.Fatalf("expected 0 empty sources after failure was marked, got %d", len(empty))
	}
}
