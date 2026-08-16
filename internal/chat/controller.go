package chat

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"
	"sync"
	"time"

	"sourcebook/internal/database"
	"sourcebook/internal/llm"
	"sourcebook/internal/models"
	"sourcebook/internal/utils"
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
	retriever *Retriever,
	reranker *Reranker,
	historyMgr *HistoryManager,
	memoryRetriever *MemoryRetriever,
	planner *QueryPlanner,
	agentLoop *AgentLoop,
	llmClient *llm.Client,
	repo *database.Repository,
	vectorClient *vector.Client,
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

	contextMeta := "Web"
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
				contextMeta = "Saved Sources"
				if req.NotebookID != "" {
					docs, _ = c.retriever.RetrieveNotebook(ctx, req.NotebookID, req.ScopedSourceIDs)
				}
			case "hybrid":
				contextMeta = "Saved Sources + Web"
				if req.NotebookID != "" {
					docs, _ = c.retriever.RetrieveHybrid(ctx, req.NotebookID, q, maxSources, req.ScopedSourceIDs)
				}
			default: // "web"
				contextMeta = "Web Search"
				docs, _ = c.retriever.RetrieveWeb(ctx, q, maxSources)
			}
			mu.Lock()
			allDocs = append(allDocs, docs...)
			mu.Unlock()
		}(subQ)
	}
	wg.Wait()

	// Deduplicate before reranking
	deduped := Deduplicate(allDocs)

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

	docs, contextMeta, err := c.RetrieveAndRerank(ctx, req, nil)
	if err != nil {
		return nil, fmt.Errorf("retrieval failed: %w", err)
	}

	docs, isExplain := c.HandleExplainQuery(ctx, req.Query, req.NotebookID, docs)

	// Run ReAct Agent Loop
	if c.agentLoop != nil && !isExplain {
		augmentedDocs, err := c.agentLoop.Run(ctx, req.Query, req.NotebookID, docs, nil)
		if err == nil && len(augmentedDocs) > 0 {
			docs = augmentedDocs
			// Persist newly discovered web/arxiv documents to the notebook
			c.PersistNewSources(ctx, req.NotebookID, docs)
		}
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

	// Retrieve semantic conversation memory
	var semanticHistory []llm.Message
	if c.memoryRetriever != nil && req.NotebookID != "" {
		semHist, err := c.memoryRetriever.RetrieveRelevantHistory(ctx, req.NotebookID, req.Query, 3)
		if err == nil && len(semHist) > 0 {
			semanticHistory = semHist
		}
	}

	// Batch and summarize sources one by one to stay under 4096 context and low RAM
	if !isExplain {
		docs = c.BatchAndSummarize(ctx, req.Query, docs, nil)
	}

	// Prepare history and LLM client prompt
	messages := c.historyMgr.BuildConversationHistory(req.Query, docs, req.History, semanticHistory)
	answer, err := c.llmClient.Generate(ctx, messages)
	if err != nil {
		return nil, fmt.Errorf("synthesis failed: %w", err)
	}

	// Save turn vector memory in background
	if c.memoryRetriever != nil && req.NotebookID != "" {
		c.memoryRetriever.SaveTurn(req.NotebookID, "", "user", req.Query)
		c.memoryRetriever.SaveTurn(req.NotebookID, "", "assistant", answer)
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
func (c *Controller) GenerateStream(ctx context.Context, req ChatRequest, onToken func(string) error, onStatus func(string)) ([]SourceCitationDetail, []models.SourceRecord, string, error) {
	docs, contextMeta, err := c.RetrieveAndRerank(ctx, req, onStatus)
	if err != nil {
		return nil, nil, "", fmt.Errorf("retrieval failed: %w", err)
	}

	docs, isExplain := c.HandleExplainQuery(ctx, req.Query, req.NotebookID, docs)

	var newSources []models.SourceRecord
	// Run ReAct Agent Loop
	if c.agentLoop != nil && !isExplain {
		augmentedDocs, err := c.agentLoop.Run(ctx, req.Query, req.NotebookID, docs, onStatus)
		if err == nil && len(augmentedDocs) > 0 {
			docs = augmentedDocs
			// Persist newly discovered web/arxiv documents to the notebook
			newSources = c.PersistNewSources(ctx, req.NotebookID, docs)
		}
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
		return citations, nil, contextMeta, nil
	}

	if onStatus != nil {
		onStatus("Synthesizing final grounded response...")
	}

	// Retrieve semantic conversation memory
	var semanticHistory []llm.Message
	if c.memoryRetriever != nil && req.NotebookID != "" {
		semHist, err := c.memoryRetriever.RetrieveRelevantHistory(ctx, req.NotebookID, req.Query, 3)
		if err == nil && len(semHist) > 0 {
			semanticHistory = semHist
		}
	}

	// Batch and summarize sources one by one to stay under 4096 context and low RAM
	if !isExplain {
		docs = c.BatchAndSummarize(ctx, req.Query, docs, onStatus)
	}

	messages := c.historyMgr.BuildConversationHistory(req.Query, docs, req.History, semanticHistory)

	var fullAnswer strings.Builder
	onTokenWrapper := func(token string) error {
		fullAnswer.WriteString(token)
		return onToken(token)
	}

	err = c.llmClient.GenerateStream(ctx, messages, onTokenWrapper)
	if err != nil {
		return nil, nil, "", fmt.Errorf("synthesis stream failed: %w", err)
	}

	// Save turn vector memory in background
	if c.memoryRetriever != nil && req.NotebookID != "" {
		c.memoryRetriever.SaveTurn(req.NotebookID, "", "user", req.Query)
		c.memoryRetriever.SaveTurn(req.NotebookID, "", "assistant", fullAnswer.String())
	}

	return citations, newSources, contextMeta, nil
}

// HandleExplainQuery detects if the query is an "Explain Source" query, finds the matched source, and returns it.
// If it's not an explain query, or the matched source isn't found, it returns the original docs.
func (c *Controller) HandleExplainQuery(ctx context.Context, query string, notebookID string, docs []Document) ([]Document, bool) {
	isExplainQuery := strings.Contains(strings.ToLower(query), "explain this source in detail:")
	if !isExplainQuery {
		return docs, false
	}

	// Try to extract target title or index
	startQuote := strings.Index(query, "\"")
	endQuote := strings.LastIndex(query, "\"")
	var targetTitle string
	if startQuote != -1 && endQuote > startQuote {
		targetTitle = query[startQuote+1 : endQuote]
	}

	var targetIndex int = -1
	startBracket := strings.LastIndex(query, "[")
	endBracket := strings.LastIndex(query, "]")
	if startBracket != -1 && endBracket > startBracket {
		idxStr := query[startBracket+1 : endBracket]
		if idx, err := strconv.Atoi(idxStr); err == nil {
			targetIndex = idx
		}
	}

	// Retrieve all notebook sources to find a match
	var matched *Document
	if notebookID != "" && c.retriever != nil {
		allNbDocs, _ := c.retriever.RetrieveNotebook(ctx, notebookID, nil)
		if targetTitle != "" {
			for _, doc := range allNbDocs {
				if strings.Contains(strings.ToLower(doc.Title), strings.ToLower(targetTitle)) || strings.Contains(strings.ToLower(targetTitle), strings.ToLower(doc.Title)) {
					matched = &doc
					break
				}
			}
		}
		if matched == nil && targetIndex != -1 && targetIndex-1 < len(allNbDocs) && targetIndex-1 >= 0 {
			matched = &allNbDocs[targetIndex-1]
		}
	}

	// Fallback to searching inside retrieved docs
	if matched == nil {
		for _, doc := range docs {
			if targetTitle != "" && (strings.Contains(strings.ToLower(doc.Title), strings.ToLower(targetTitle)) || strings.Contains(strings.ToLower(targetTitle), strings.ToLower(doc.Title))) {
				matched = &doc
				break
			}
		}
	}

	if matched != nil {
		// Override docs with the matched doc, keeping content full (up to 3500 words / 12000 runes)
		contentRunes := []rune(matched.Content)
		if len(contentRunes) > 12000 {
			matched.Content = string(contentRunes[:12000]) + "... [Truncated]"
		}
		log.Printf("[ChatController] HandleExplainQuery: Successfully matched source %q", matched.Title)
		return []Document{*matched}, true
	}

	return docs, true
}

// BatchAndSummarize processes documents one by one to extract query-relevant information, staying under 4096 context.
func (c *Controller) BatchAndSummarize(ctx context.Context, query string, docs []Document, onStatus func(string)) []Document {
	var summarizedDocs []Document

	for i, doc := range docs {
		// Clean the text
		cleaned := utils.CleanText(doc.Content)
		if len(cleaned) < 500 {
			doc.Content = cleaned
			summarizedDocs = append(summarizedDocs, doc)
			continue
		}

		if onStatus != nil {
			onStatus(fmt.Sprintf("Digesting source %d/%d: %s...", i+1, len(docs), doc.Title))
		}

		// Call LLM one by one to get a concise summary/extraction
		prompt := fmt.Sprintf(`You are a precise facts extractor. Read the following source document and extract key factual points relevant to the query: %q.
Keep the extraction extremely concise, returning only the direct facts as a bulleted list. Keep it under 200 words total. Do not add any conversational text.

Document Title: %s
Content:
%s`, query, doc.Title, cleaned)

		messages := []llm.Message{
			{Role: "user", Content: prompt},
		}

		log.Printf("[BatchAndSummarize] Digesting source: %q (length: %d)...", doc.Title, len(cleaned))
		summary, err := c.llmClient.Generate(ctx, messages)
		if err != nil {
			log.Printf("[BatchAndSummarize] Warning: failed to digest %q: %v", doc.Title, err)
			runes := []rune(cleaned)
			if len(runes) > 1000 {
				doc.Content = string(runes[:1000]) + "... [Truncated]"
			} else {
				doc.Content = cleaned
			}
			summarizedDocs = append(summarizedDocs, doc)
			continue
		}

		doc.Content = summary
		summarizedDocs = append(summarizedDocs, doc)
	}

	return summarizedDocs
}

// PersistNewSources checks for newly discovered web/arxiv documents and adds them as permanent sources to the notebook database.
func (c *Controller) PersistNewSources(ctx context.Context, notebookID string, docs []Document) []models.SourceRecord {
	if notebookID == "" || c.repo == nil || c.vectorClient == nil {
		return nil
	}

	existingSources, err := c.repo.GetSourcesByNotebook(notebookID)
	if err != nil {
		log.Printf("[PersistNewSources] Failed to fetch existing sources: %v", err)
		return nil
	}

	existingURLs := make(map[string]bool)
	for _, s := range existingSources {
		existingURLs[strings.ToLower(strings.TrimSpace(s.URL))] = true
		existingURLs[strings.ToLower(strings.TrimSpace(s.CanonicalURL))] = true
	}

	var newSources []models.SourceRecord
	for _, d := range docs {
		// Only save non-notebook sources (web, arxiv)
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
			log.Printf("[PersistNewSources] Failed to save source %s: %v", src.Title, err)
			continue
		}
		newSources = append(newSources, src)
		existingURLs[urlKey] = true
		log.Printf("[PersistNewSources] Successfully saved newly fetched source: %s (%s)", src.Title, src.URL)
	}

	if len(newSources) > 0 {
		// Asynchronously chunk and embed the new sources
		go func(sources []models.SourceRecord) {
			bgCtx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
			defer cancel()

			var allChunks []models.DocumentChunk
			for _, src := range sources {
				log.Printf("[PersistNewSources] Async embedding new source: %s", src.Title)
				pythonChunks, err := c.vectorClient.GenerateEmbeddings(bgCtx, src.Content)
				if err != nil {
					log.Printf("[PersistNewSources] Failed to generate embeddings for %s: %v", src.ID, err)
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
				if err := c.repo.SaveChunks(notebookID, allChunks); err != nil {
					log.Printf("[PersistNewSources] Failed to save chunks for persistent sources: %v", err)
				} else {
					log.Printf("[PersistNewSources] Successfully embedded and saved %d chunks", len(allChunks))
				}
			}
		}(newSources)
	}
	return newSources
}
