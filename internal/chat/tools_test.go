package chat

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"sourcebook/internal/database"
	"sourcebook/internal/models"
)

func TestToolArxivFetch_ParsedContentWithoutHTMLBoilerplate(t *testing.T) {
	mockJina := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var req struct {
			URLs []string `json:"urls"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		resp := map[string]interface{}{
			"success": true,
			"data": []map[string]interface{}{
				{
					"url":      req.URLs[0],
					"title":    "Attention Is All You Need",
					"markdown": "# Attention Is All You Need\n\nThe dominant sequence transduction models are based on complex recurrent or convolutional neural networks.",
					"success":  true,
				},
			},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer mockJina.Close()

	t.Setenv("JINA_SERVICE_URL", mockJina.URL)

	tools := NewToolRegistry(nil)

	// Test with arXiv ID string
	doc, err := tools.ToolArxivFetch(context.Background(), "1706.03762")
	if err != nil {
		t.Fatalf("ToolArxivFetch failed: %v", err)
	}

	if doc == nil {
		t.Fatal("expected non-nil document")
	}

	if doc.Title != "Attention Is All You Need" {
		t.Errorf("expected title 'Attention Is All You Need', got %q", doc.Title)
	}
	if doc.URL != "https://arxiv.org/abs/1706.03762" {
		t.Errorf("expected URL 'https://arxiv.org/abs/1706.03762', got %q", doc.URL)
	}
	if doc.SourceType != "Arxiv" {
		t.Errorf("expected SourceType 'Arxiv', got %q", doc.SourceType)
	}

	// Verify absence of raw HTML boilerplate
	prohibited := []string{"<!DOCTYPE", "<html", "<script", "<head", "<body", "Site Navigation"}
	for _, p := range prohibited {
		if strings.Contains(strings.ToLower(doc.Content), strings.ToLower(p)) {
			t.Errorf("doc.Content contains raw HTML boilerplate %q", p)
		}
	}

	if !strings.Contains(doc.Content, "dominant sequence transduction models") {
		t.Errorf("expected doc.Content to contain extracted paper text, got %q", doc.Content)
	}
}

func TestToolNotebookSearch_RanksAndFiltersByQuery(t *testing.T) {
	db, err := database.InitDB(":memory:")
	if err != nil {
		t.Fatalf("InitDB failed: %v", err)
	}
	defer db.Close()
	repo := database.NewRepository(db)

	nb, err := repo.CreateNotebook("AI Research", "Testing notebook search")
	if err != nil {
		t.Fatalf("CreateNotebook failed: %v", err)
	}

	sources := []models.SourceRecord{
		{
			ID:         "src-transformer",
			NotebookID: nb.ID,
			Title:      "Transformer Architecture",
			Content:    "Attention mechanisms in transformer neural networks allow parallel token processing across sequences.",
		},
		{
			ID:         "src-culinary",
			NotebookID: nb.ID,
			Title:      "French Culinary Arts",
			Content:    "Making a tender omelette requires low skillet heat and plenty of fresh butter.",
		},
		{
			ID:         "src-marine",
			NotebookID: nb.ID,
			Title:      "Marine Biology Notes",
			Content:    "Coral reefs in tropical oceans support diverse aquatic ecosystems and fish populations.",
		},
	}

	for i := range sources {
		if err := repo.AddSource(&sources[i]); err != nil {
			t.Fatalf("AddSource failed: %v", err)
		}
	}

	retriever := NewRetriever(repo, nil)
	tools := NewToolRegistry(retriever)
	ctx := context.Background()

	// Query 1: search for transformer / attention
	transformerDocs, err := tools.ToolNotebookSearch(ctx, nb.ID, "transformer attention neural tokens")
	if err != nil {
		t.Fatalf("ToolNotebookSearch failed: %v", err)
	}
	if len(transformerDocs) == 0 {
		t.Fatal("expected at least one matching document")
	}
	if transformerDocs[0].Title != "Transformer Architecture" {
		t.Errorf("expected top document to be 'Transformer Architecture', got %q", transformerDocs[0].Title)
	}

	// Query 2: search for cooking / omelette
	culinaryDocs, err := tools.ToolNotebookSearch(ctx, nb.ID, "omelette butter skillet")
	if err != nil {
		t.Fatalf("ToolNotebookSearch failed: %v", err)
	}
	if len(culinaryDocs) == 0 {
		t.Fatal("expected at least one matching document")
	}
	if culinaryDocs[0].Title != "French Culinary Arts" {
		t.Errorf("expected top document to be 'French Culinary Arts', got %q", culinaryDocs[0].Title)
	}

	// Query 3: empty query should return all documents without error
	allDocs, err := tools.ToolNotebookSearch(ctx, nb.ID, "")
	if err != nil {
		t.Fatalf("ToolNotebookSearch with empty query failed: %v", err)
	}
	if len(allDocs) != 3 {
		t.Errorf("expected 3 documents for empty query, got %d", len(allDocs))
	}
}
