package chat

import (
	"context"
	"fmt"
	"strings"
	"time"

	"sourcebook/internal/llm"
	"sourcebook/internal/models"
)

// Generate synthesizes a full non-streaming grounded response
func (c *Controller) Generate(ctx context.Context, req ChatRequest) (*ChatResponse, error) {
	startTime := time.Now()

	docs, contextMeta, err := c.RetrieveAndRerank(ctx, req, nil)
	if err != nil {
		return nil, fmt.Errorf("retrieval failed: %w", err)
	}

	docs, isExplain := c.HandleExplainQuery(ctx, req.Query, req.NotebookID, docs)

	if c.agentLoop != nil && !isExplain {
		augmentedDocs, err := c.agentLoop.Run(ctx, req.Query, req.NotebookID, docs, nil)
		if err == nil && len(augmentedDocs) > 0 {
			docs = augmentedDocs
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

	historyMessages := req.History
	if len(historyMessages) == 0 && c.repo != nil && req.NotebookID != "" {
		dbMsgs, err := c.repo.GetMessagesByNotebook(req.NotebookID)
		if err == nil {
			for _, m := range dbMsgs {
				historyMessages = append(historyMessages, llm.Message{Role: m.Role, Content: m.Content})
			}
		}
	}

	var semanticHistory []llm.Message
	if c.memoryRetriever != nil && req.NotebookID != "" {
		semHist, err := c.memoryRetriever.RetrieveRelevantHistory(ctx, req.NotebookID, req.Query, 3)
		if err == nil {
			semanticHistory = semHist
		}
	}

	if !isExplain {
		docs = c.BatchAndSummarize(ctx, req.Query, docs, nil)
	}

	messages := c.historyMgr.BuildConversationHistory(req.Query, docs, historyMessages, semanticHistory)
	answer, err := c.llmClient.Generate(ctx, messages)
	if err != nil {
		return nil, fmt.Errorf("synthesis failed: %w", err)
	}

	if req.NotebookID != "" {
		if c.repo != nil {
			_, _ = c.repo.AddMessage(req.NotebookID, "user", req.Query)
			_, _ = c.repo.AddMessage(req.NotebookID, "assistant", answer)
		}
		if c.memoryRetriever != nil {
			c.memoryRetriever.SaveTurn(req.NotebookID, "", "user", req.Query)
			c.memoryRetriever.SaveTurn(req.NotebookID, "", "assistant", answer)
		}
	}

	citations := make([]SourceCitationDetail, len(docs))
	for i, doc := range docs {
		idx := i + 1
		if doc.Index > 0 {
			idx = doc.Index
		}
		citations[i] = SourceCitationDetail{Index: idx, Title: doc.Title, URL: doc.URL, SourceType: doc.SourceType}
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
	if c.agentLoop != nil && !isExplain {
		augmentedDocs, err := c.agentLoop.Run(ctx, req.Query, req.NotebookID, docs, onStatus)
		if err == nil && len(augmentedDocs) > 0 {
			docs = augmentedDocs
			newSources = c.PersistNewSources(ctx, req.NotebookID, docs)
		}
	}

	citations := make([]SourceCitationDetail, len(docs))
	for i, doc := range docs {
		idx := i + 1
		if doc.Index > 0 {
			idx = doc.Index
		}
		citations[i] = SourceCitationDetail{Index: idx, Title: doc.Title, URL: doc.URL, SourceType: doc.SourceType}
	}

	if len(docs) == 0 {
		_ = onToken("No relevant search context could be retrieved to formulate an answer.")
		return citations, nil, contextMeta, nil
	}

	if onStatus != nil {
		onStatus("Synthesizing final grounded response...")
	}

	historyMessages := req.History
	if len(historyMessages) == 0 && c.repo != nil && req.NotebookID != "" {
		dbMsgs, err := c.repo.GetMessagesByNotebook(req.NotebookID)
		if err == nil {
			for _, m := range dbMsgs {
				historyMessages = append(historyMessages, llm.Message{Role: m.Role, Content: m.Content})
			}
		}
	}

	var semanticHistory []llm.Message
	if c.memoryRetriever != nil && req.NotebookID != "" {
		semHist, err := c.memoryRetriever.RetrieveRelevantHistory(ctx, req.NotebookID, req.Query, 3)
		if err == nil {
			semanticHistory = semHist
		}
	}

	if !isExplain {
		docs = c.BatchAndSummarize(ctx, req.Query, docs, onStatus)
	}

	messages := c.historyMgr.BuildConversationHistory(req.Query, docs, historyMessages, semanticHistory)

	var fullAnswer strings.Builder
	onTokenWrapper := func(token string) error {
		fullAnswer.WriteString(token)
		return onToken(token)
	}

	err = c.llmClient.GenerateStream(ctx, messages, onTokenWrapper)
	if err != nil {
		return nil, nil, "", fmt.Errorf("synthesis stream failed: %w", err)
	}

	if req.NotebookID != "" {
		if c.repo != nil {
			_, _ = c.repo.AddMessage(req.NotebookID, "user", req.Query)
			_, _ = c.repo.AddMessage(req.NotebookID, "assistant", fullAnswer.String())
		}
		if c.memoryRetriever != nil {
			c.memoryRetriever.SaveTurn(req.NotebookID, "", "user", req.Query)
			c.memoryRetriever.SaveTurn(req.NotebookID, "", "assistant", fullAnswer.String())
		}
	}

	return citations, newSources, contextMeta, nil
}
