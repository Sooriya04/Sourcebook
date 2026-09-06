package chat

import (
	"context"
	"log"
	"strings"
	"sync"
	"time"

	"sourcebook/internal/database"
	"sourcebook/internal/llm"
	"sourcebook/internal/models"
	"sourcebook/internal/vector"

	"github.com/google/uuid"
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

// RetrieveAndRerank executes query planning, sub-query retrieval, and hybrid reranking
func (c *Controller) RetrieveAndRerank(ctx context.Context, req ChatRequest, onStatus func(string)) ([]Document, string, error) {
	var subQueries []string
	var err error

	if c.planner != nil {
		if onStatus != nil {
			onStatus("Planning research strategy (decomposing query)...")
		}
		subQueries, err = c.planner.Decompose(ctx, req.Query)
		if err != nil || len(subQueries) == 0 {
			subQueries = []string{req.Query}
		}
	} else {
		subQueries = []string{req.Query}
	}

	var allDocs []Document
	var mu sync.Mutex
	var wg sync.WaitGroup

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

	for _, subQ := range subQueries {
		wg.Add(1)
		go func(q string) {
			defer wg.Done()
			var docs []Document
			switch req.Mode {
			case "notebook":
				if req.NotebookID != "" {
					docs, _ = c.retriever.RetrieveNotebook(ctx, req.NotebookID, req.ScopedSourceIDs)
				}
			case "hybrid":
				if req.NotebookID != "" {
					docs, _ = c.retriever.RetrieveHybrid(ctx, req.NotebookID, q, maxSources, req.ScopedSourceIDs)
				}
			default:
				docs, _ = c.retriever.RetrieveWeb(ctx, q, maxSources)
			}
			mu.Lock()
			allDocs = append(allDocs, docs...)
			mu.Unlock()
		}(subQ)
	}
	wg.Wait()

	deduped := Deduplicate(allDocs)
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

// PersistNewSources checks for newly discovered web/arxiv documents and adds them to the notebook database.
func (c *Controller) PersistNewSources(ctx context.Context, notebookID string, docs []Document) []models.SourceRecord {
	if notebookID == "" || c.repo == nil || c.vectorClient == nil {
		return nil
	}

	existingSources, err := c.repo.GetSourcesByNotebook(notebookID)
	if err != nil {
		return nil
	}

	existingURLs := make(map[string]bool)
	for _, s := range existingSources {
		existingURLs[strings.ToLower(strings.TrimSpace(s.URL))] = true
		existingURLs[strings.ToLower(strings.TrimSpace(s.CanonicalURL))] = true
	}

	var newSources []models.SourceRecord
	for _, d := range docs {
		if d.SourceType == "Notebook" {
			continue
		}
		urlKey := strings.ToLower(strings.TrimSpace(d.URL))
		if urlKey == "" || existingURLs[urlKey] {
			continue
		}

		src := models.SourceRecord{
			ID:           uuid.NewString(),
			NotebookID:   notebookID,
			Title:        d.Title,
			URL:          d.URL,
			CanonicalURL: d.URL,
			Content:      d.Content,
			Provider:     d.SourceType,
			Type:         d.SourceType,
		}

		if err := c.repo.AddSource(&src); err != nil {
			continue
		}
		newSources = append(newSources, src)
		existingURLs[urlKey] = true
	}

	if len(newSources) > 0 {
		go func(sources []models.SourceRecord) {
			bgCtx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
			defer cancel()

			var allChunks []models.DocumentChunk
			for _, src := range sources {
				pythonChunks, err := c.vectorClient.GenerateEmbeddings(bgCtx, src.Content)
				if err != nil {
					continue
				}

				for i, pc := range pythonChunks {
					allChunks = append(allChunks, models.DocumentChunk{
						ID:         uuid.NewString(),
						NotebookID: notebookID,
						SourceID:   src.ID,
						ChunkIndex: i,
						Content:    pc.Chunk,
						Embedding:  pc.Embedding,
					})
				}
			}

			if len(allChunks) > 0 {
				_ = c.repo.SaveChunks(notebookID, allChunks)
			}
		}(newSources)
	}
	return newSources
}
