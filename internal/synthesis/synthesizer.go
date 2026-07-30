package synthesis

import (
	"context"
	"fmt"
	"log"
	"time"

	"sourcebook/internal/llm"
	"sourcebook/internal/utils"
)

type ScrapedDoc struct {
	Title   string `json:"title"`
	URL     string `json:"url"`
	Content string `json:"content"`
}

type Synthesizer struct {
	llmClient *llm.Client
}

func NewSynthesizer() *Synthesizer {
	return &Synthesizer{
		llmClient: llm.NewClient(),
	}
}

// Synthesize takes scraped documents and a user query, cleans the content, builds a grounded RAG prompt, and calls the LLM.
func (s *Synthesizer) Synthesize(ctx context.Context, query string, docs []ScrapedDoc) (*llm.SynthesisResponse, error) {
	startTime := time.Now()

	var docContexts []llm.DocumentContext
	for i, doc := range docs {
		cleaned := utils.CleanText(doc.Content)
		if cleaned == "" {
			continue
		}

		docContexts = append(docContexts, llm.DocumentContext{
			Index:   i + 1,
			Title:   doc.Title,
			URL:     doc.URL,
			Content: cleaned,
		})
	}

	if len(docContexts) == 0 {
		return &llm.SynthesisResponse{
			Query:      query,
			Answer:     "No content could be retrieved from search sources to synthesize an answer.",
			Sources:    []llm.SourceCitation{},
			DurationMs: time.Since(startTime).Milliseconds(),
		}, nil
	}

	log.Printf("[Synthesizer] Building prompt for %d cleaned documents...", len(docContexts))
	messages, citations := llm.BuildPrompt(query, docContexts)

	log.Printf("[Synthesizer] Calling LLM engine...")
	answer, err := s.llmClient.Generate(ctx, messages)
	if err != nil {
		return nil, fmt.Errorf("LLM synthesis error: %w", err)
	}

	return &llm.SynthesisResponse{
		Query:      query,
		Answer:     answer,
		Sources:    citations,
		DurationMs: time.Since(startTime).Milliseconds(),
	}, nil
}
