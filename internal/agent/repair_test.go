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

func TestRepairWebSources_Sanitization(t *testing.T) {
	// Setup test HTTP server mimicking Searqon scraper returning uncleaned text
	dirtyText := "Line 1   \n\n\n\nLine 2 \t with tabs\r\n\r\n\nLine 3   "
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		resp := map[string]interface{}{
			"success": true,
			"data": []map[string]string{
				{
					"url":      "https://example.com/article",
					"markdown": dirtyText,
				},
			},
		}
		json.NewEncoder(w).Encode(resp)
	}))
	defer server.Close()

	t.Setenv("SEARQON_SCRAPE_URL", server.URL)

	// In-memory SQLite DB
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("failed to open sqlite: %v", err)
	}
	defer db.Close()

	_, err = db.Exec(`
		CREATE TABLE notebooks (id TEXT PRIMARY KEY, title TEXT);
		CREATE TABLE sources (id TEXT PRIMARY KEY, notebook_id TEXT, url TEXT, content TEXT, updated_at DATETIME);
		INSERT INTO notebooks (id, title) VALUES ('nb1', 'Test NB');
		INSERT INTO sources (id, notebook_id, url, content) VALUES ('src1', 'nb1', 'https://example.com/article', '');
	`)
	if err != nil {
		t.Fatalf("failed to create tables: %v", err)
	}

	sentinel := NewSentinel(db)
	repaired := sentinel.repairWebSources(context.Background(), []emptySource{
		{ID: "src1", NotebookID: "nb1", URL: "https://example.com/article"},
	})

	if repaired != 1 {
		t.Fatalf("expected 1 repaired source, got %d", repaired)
	}

	var savedContent string
	err = db.QueryRow(`SELECT content FROM sources WHERE id = 'src1'`).Scan(&savedContent)
	if err != nil {
		t.Fatalf("failed to query source: %v", err)
	}

	expected := "Line 1\n\nLine 2   with tabs\n\nLine 3"
	if savedContent != expected {
		t.Fatalf("expected cleaned content:\n%q\ngot:\n%q", expected, savedContent)
	}
}
