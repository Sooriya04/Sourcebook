package chat

import (
	"context"
	"fmt"
	"log"
	"time"

	"sourcebook/internal/llm"
)

type Controller struct {
	retriever  *Retriever
	reranker   *Reranker
	historyMgr *HistoryManager
	llmClient  *llm.Client
}

func NewController(retriever *Retriever, reranker *Reranker, historyMgr *HistoryManager, llmClient *llm.Client) *Controller {
	return &Controller{
		retriever:  retriever,
		reranker:   reranker,
		historyMgr: historyMgr,
		llmClient:  llmClient,
	}
}

// RetrieveAndRerank executes retrieval (Notebook, Web, Hybrid), deduplicates, and hybrid reranks the docs
func (c *Controller) RetrieveAndRerank(ctx context.Context, req ChatRequest) ([]Document, string, error) {
	var docs []Document
	var err error
	contextMeta := "Web"

	maxSources := req.MaxSources
	if maxSources <= 0 || maxSources > 15 {
		maxSources = 5
	}

	switch req.Mode {
	case "notebook":
		contextMeta = "Saved Sources"
		if req.NotebookID == "" {
			return nil, "", fmt.Errorf("notebook ID is required for notebook mode")
		}
		docs, err = c.retriever.RetrieveNotebook(ctx, req.NotebookID, req.ScopedSourceIDs)
	case "hybrid":
		contextMeta = "Saved Sources + Web"
		if req.NotebookID == "" {
			return nil, "", fmt.Errorf("notebook ID is required for hybrid mode")
		}
		docs, err = c.retriever.RetrieveHybrid(ctx, req.NotebookID, req.Query, maxSources, req.ScopedSourceIDs)
	default: // "web"
		contextMeta = "Web Search"
		docs, err = c.retriever.RetrieveWeb(ctx, req.Query, maxSources)
	}

	if err != nil {
		return nil, "", err
	}

	// Deduplicate before reranking
	deduped := Deduplicate(docs)

	// Rerank using vector + keyword scores
	reranked, err := c.reranker.Rerank(ctx, req.Query, deduped, maxSources)
	if err != nil {
		log.Printf("[ChatController] Reranking failed: %v. Using un-reranked docs.", err)
		if len(deduped) > maxSources {
			return deduped[:maxSources], contextMeta, nil
		}
		return deduped, contextMeta, nil
	}

	return reranked, contextMeta, nil
}

// Generate synthesizes a full non-streaming grounded response
func (c *Controller) Generate(ctx context.Context, req ChatRequest) (*ChatResponse, error) {
	startTime := time.Now()

	docs, contextMeta, err := c.RetrieveAndRerank(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("retrieval failed: %w", err)
	}

	if len(docs) == 0 {
		return &ChatResponse{
			Query:      req.Query,
			Answer:     "No relevant search context could be retrieved to formulate an answer.",
			Sources:    []SourceCitationDetail{},
			DurationMs: time.Since(startTime).Milliseconds(),
			Context:    contextMeta,
		}, nil
	}

	// Prepare history and LLM client prompt
	messages := c.historyMgr.BuildConversationHistory(req.Query, docs, req.History)
	answer, err := c.llmClient.Generate(ctx, messages)
	if err != nil {
		return nil, fmt.Errorf("synthesis failed: %w", err)
	}

	citations := make([]SourceCitationDetail, len(docs))
	for i, doc := range docs {
		citations[i] = SourceCitationDetail{
			Index:      i + 1,
			Title:      doc.Title,
			URL:        doc.URL,
			SourceType: doc.SourceType,
		}
	}

	return &ChatResponse{
		Query:      req.Query,
		Answer:     answer,
		Sources:    citations,
		DurationMs: time.Since(startTime).Milliseconds(),
		Context:    contextMeta,
	}, nil
}

// GenerateStream synthesizes a streaming grounded response calling onToken for each chunk
func (c *Controller) GenerateStream(ctx context.Context, req ChatRequest, onToken func(string) error) ([]SourceCitationDetail, string, error) {
	docs, contextMeta, err := c.RetrieveAndRerank(ctx, req)
	if err != nil {
		return nil, "", fmt.Errorf("retrieval failed: %w", err)
	}

	citations := make([]SourceCitationDetail, len(docs))
	for i, doc := range docs {
		citations[i] = SourceCitationDetail{
			Index:      i + 1,
			Title:      doc.Title,
			URL:        doc.URL,
			SourceType: doc.SourceType,
		}
	}

	if len(docs) == 0 {
		_ = onToken("No relevant search context could be retrieved to formulate an answer.")
		return citations, contextMeta, nil
	}

	messages := c.historyMgr.BuildConversationHistory(req.Query, docs, req.History)
	err = c.llmClient.GenerateStream(ctx, messages, onToken)
	if err != nil {
		return nil, "", fmt.Errorf("synthesis stream failed: %w", err)
	}

	return citations, contextMeta, nil
}
