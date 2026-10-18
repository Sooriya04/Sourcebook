package chat

import (
	"context"
	"log"
	"sync"

	"sourcebook/internal/database"
	"sourcebook/internal/llm"
	"sourcebook/internal/vector"
)

type Controller struct {
	retriever       *Retriever
	reranker        *Reranker
	historyMgr      *HistoryManager
	memoryRetriever *MemoryRetriever
	planner         *QueryPlanner
	agentLoop       *AgentLoop
	llmClient       *llm.Client
	repo            *database.Repository
	vectorClient    *vector.Client
}

func NewController(
	retriever *Retriever, reranker *Reranker, historyMgr *HistoryManager,
	memoryRetriever *MemoryRetriever, planner *QueryPlanner, agentLoop *AgentLoop,
	llmClient *llm.Client, repo *database.Repository, vectorClient *vector.Client,
) *Controller {
	return &Controller{
		retriever:       retriever,
		reranker:        reranker,
		historyMgr:      historyMgr,
		memoryRetriever: memoryRetriever,
		planner:         planner,
		agentLoop:       agentLoop,
		llmClient:       llmClient,
		repo:            repo,
		vectorClient:    vectorClient,
	}
}

// RetrieveAndRerank executes multi-turn resolution, query planning, sub-query retrieval, and hybrid reranking.
func (c *Controller) RetrieveAndRerank(ctx context.Context, req ChatRequest, onStatus func(string)) ([]Document, string, error) {
	// 1. Resolve multi-turn context using recent conversation history
	historyMessages := req.History
	if len(historyMessages) == 0 && c.repo != nil && req.NotebookID != "" {
		if dbMsgs, err := c.repo.GetMessagesByNotebook(req.NotebookID); err == nil {
			for _, m := range dbMsgs {
				historyMessages = append(historyMessages, llm.Message{Role: m.Role, Content: m.Content})
			}
		}
	}

	resolvedQuery := req.Query
	if c.planner != nil && len(historyMessages) > 0 {
		if onStatus != nil {
			onStatus("Resolving conversational context...")
		}
		if rewritten, err := c.planner.ResolveQuery(ctx, req.Query, historyMessages); err == nil && rewritten != "" {
			resolvedQuery = rewritten
		}
	}

	// 2. Decompose resolved query into focused sub-queries
	var subQueries []string
	if c.planner != nil {
		if onStatus != nil {
			onStatus("Planning research strategy (decomposing query)...")
		}
		var err error
		subQueries, err = c.planner.Decompose(ctx, resolvedQuery)
		if err != nil || len(subQueries) == 0 {
			subQueries = []string{resolvedQuery}
		}
	} else {
		subQueries = []string{resolvedQuery}
	}

	contextMeta := "Web Search"
	switch req.Mode {
	case "notebook":
		contextMeta = "Saved Sources"
	case "hybrid":
		contextMeta = "Saved Sources + Web"
	}

	maxSources := req.MaxSources
	if maxSources <= 0 || maxSources > 15 {
		maxSources = 5
	}

	// 3. Dispatch retrieval
	var allDocs []Document
	if req.Mode == "notebook" {
		if req.NotebookID != "" {
			allDocs, _ = c.retriever.RetrieveNotebook(ctx, req.NotebookID, req.ScopedSourceIDs)
		}
	} else {
		var mu sync.Mutex
		var wg sync.WaitGroup

		if req.Mode == "hybrid" && req.NotebookID != "" {
			wg.Add(1)
			go func() {
				defer wg.Done()
				nbDocs, _ := c.retriever.RetrieveNotebook(ctx, req.NotebookID, req.ScopedSourceIDs)
				mu.Lock()
				allDocs = append(allDocs, nbDocs...)
				mu.Unlock()
			}()
		}

		for _, subQ := range subQueries {
			wg.Add(1)
			go func(q string) {
				defer wg.Done()
				webDocs, _ := c.retriever.RetrieveWeb(ctx, q, maxSources)
				mu.Lock()
				allDocs = append(allDocs, webDocs...)
				mu.Unlock()
			}(subQ)
		}
		wg.Wait()
	}

	// 4. Execute hybrid vector & BM25 reranking using Reciprocal Rank Fusion
	if onStatus != nil {
		onStatus("Executing hybrid vector & BM25 reranking...")
	}
	deduped := Deduplicate(allDocs)
	reranked, err := c.reranker.Rerank(ctx, resolvedQuery, deduped, maxSources)
	if err != nil {
		log.Printf("[ChatController] Reranking failed: %v. Using un-reranked docs.", err)
		if len(deduped) > maxSources {
			return deduped[:maxSources], contextMeta, nil
		}
		return deduped, contextMeta, nil
	}

	return reranked, contextMeta, nil
}
