package chat

import (
	"context"
	"fmt"
	"io"
	"log"
	"net/http"
	"sourcebook/internal/utils"
	"strings"
	"time"
)

type ToolRegistry struct {
	retriever *Retriever
}

func NewToolRegistry(retriever *Retriever) *ToolRegistry {
	return &ToolRegistry{
		retriever: retriever,
	}
}

// ToolWebSearch triggers live web discovery & scraping for a query
func (tr *ToolRegistry) ToolWebSearch(ctx context.Context, query string, maxSources int) ([]Document, error) {
	if tr.retriever == nil {
		return nil, fmt.Errorf("retriever not initialized")
	}
	log.Printf("[AgentTool] Executing WebSearch for %q", query)
	return tr.retriever.RetrieveWeb(ctx, query, maxSources)
}

// ToolNotebookSearch executes semantic vector search inside a notebook
func (tr *ToolRegistry) ToolNotebookSearch(ctx context.Context, notebookID string, query string) ([]Document, error) {
	if tr.retriever == nil {
		return nil, fmt.Errorf("retriever not initialized")
	}
	log.Printf("[AgentTool] Executing NotebookSearch in %s for %q", notebookID, query)
	return tr.retriever.RetrieveNotebook(ctx, notebookID, nil)
}

// ToolArxivFetch fetches abstract / text from arXiv for a given arXiv ID or URL
func (tr *ToolRegistry) ToolArxivFetch(ctx context.Context, arxivIDOrURL string) (*Document, error) {
	cleanID := strings.TrimPrefix(arxivIDOrURL, "https://arxiv.org/abs/")
	cleanID = strings.TrimPrefix(cleanID, "https://arxiv.org/pdf/")
	cleanID = strings.TrimSuffix(cleanID, ".pdf")
	cleanID = strings.TrimSpace(cleanID)

	log.Printf("[AgentTool] Fetching arXiv paper %s", cleanID)
	absURL := fmt.Sprintf("https://arxiv.org/abs/%s", cleanID)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, absURL, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("User-Agent", "SourceBook-Agent/1.0")

	client := &http.Client{Timeout: 8 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("arXiv fetch failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("arXiv HTTP status %d", resp.StatusCode)
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}
	doc := utils.CleanText(string(bodyBytes))

	title := fmt.Sprintf("arXiv Paper %s", cleanID)
	return &Document{
		Title:      title,
		URL:        absURL,
		Content:    doc,
		SourceType: "Arxiv",
	}, nil
}
