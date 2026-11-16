package chat

import (
	"context"
	"fmt"
	"log"
	"sort"
	"strings"

	"sourcebook/internal/arxiv"
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

// ToolNotebookSearch executes semantic search inside a notebook scored and ranked by query
func (tr *ToolRegistry) ToolNotebookSearch(ctx context.Context, notebookID string, query string) ([]Document, error) {
	if tr.retriever == nil {
		return nil, fmt.Errorf("retriever not initialized")
	}
	log.Printf("[AgentTool] Executing NotebookSearch in %s for %q", notebookID, query)
	docs, err := tr.retriever.RetrieveNotebook(ctx, notebookID, nil)
	if err != nil || len(docs) == 0 {
		return docs, err
	}

	trimmedQuery := strings.TrimSpace(query)
	if trimmedQuery == "" {
		return docs, nil
	}

	scores := CalculateBM25(trimmedQuery, docs)
	type docScore struct {
		doc   Document
		score float32
	}
	scored := make([]docScore, len(docs))
	for i, d := range docs {
		scored[i] = docScore{doc: d, score: scores[i]}
	}

	sort.SliceStable(scored, func(i, j int) bool {
		return scored[i].score > scored[j].score
	})

	limit := 5
	var result []Document
	for _, sd := range scored {
		if sd.score > 0 {
			result = append(result, sd.doc)
			if len(result) >= limit {
				break
			}
		}
	}

	if len(result) == 0 {
		max := len(scored)
		if max > limit {
			max = limit
		}
		for i := 0; i < max; i++ {
			result = append(result, scored[i].doc)
		}
	}

	return result, nil
}

// ToolArxivFetch fetches parsed abstract / text from arXiv for a given arXiv ID or URL
func (tr *ToolRegistry) ToolArxivFetch(ctx context.Context, arxivIDOrURL string) (*Document, error) {
	raw := strings.TrimSpace(arxivIDOrURL)
	if raw == "" {
		return nil, fmt.Errorf("empty arXiv identifier")
	}

	absURL := raw
	if id := arxiv.ExtractArxivID(raw); id != "" {
		absURL = fmt.Sprintf("https://arxiv.org/abs/%s", id)
	} else if !strings.HasPrefix(raw, "http://") && !strings.HasPrefix(raw, "https://") {
		cleanID := strings.TrimSpace(raw)
		absURL = fmt.Sprintf("https://arxiv.org/abs/%s", cleanID)
	}

	log.Printf("[AgentTool] Fetching arXiv paper %s", absURL)
	title, content, err := arxiv.FetchSingleArxivDocument(ctx, absURL)
	if err != nil {
		return nil, err
	}

	return &Document{
		Title:      title,
		URL:        absURL,
		Content:    content,
		SourceType: "Arxiv",
	}, nil
}
