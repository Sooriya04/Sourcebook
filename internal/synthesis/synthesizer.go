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

	log.Printf("[Synthesizer] Batching and digesting %d documents...", len(docContexts))
	docContexts = s.BatchAndSummarize(ctx, query, docContexts)

	log.Printf("[Synthesizer] Building prompt for %d digested documents...", len(docContexts))
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

// GenerateFlashcards constructs a prompt from the given docs and returns raw JSON string from LLM.
func (s *Synthesizer) GenerateFlashcards(ctx context.Context, docs []ScrapedDoc) (string, error) {
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
		return "[]", nil
	}

	log.Printf("[Synthesizer] Batching and digesting %d documents for flashcards...", len(docContexts))
	docContexts = s.BatchAndSummarize(ctx, "Key facts, concepts, definitions, and core ideas for flashcard study study review guide", docContexts)

	messages := llm.BuildFlashcardPrompt(docContexts)
	
	log.Printf("[Synthesizer] Calling LLM engine for Flashcards...")
	answer, err := s.llmClient.Generate(ctx, messages)
	if err != nil {
		return "", fmt.Errorf("LLM flashcard error: %w", err)
	}

	// Sometimes LLMs still wrap in markdown despite being told not to. 
	// Basic sanitation to strip ```json and ``` 
	if len(answer) > 7 && answer[:7] == "```json" {
		answer = answer[7:]
	} else if len(answer) > 3 && answer[:3] == "```" {
		answer = answer[3:]
	}
	if len(answer) > 3 && answer[len(answer)-3:] == "```" {
		answer = answer[:len(answer)-3]
	}

	return answer, nil
}

// BatchAndSummarize processes documents one by one to extract query-relevant information, staying under 4096 context.
func (s *Synthesizer) BatchAndSummarize(ctx context.Context, query string, docs []llm.DocumentContext) []llm.DocumentContext {
	var summarizedDocs []llm.DocumentContext

	for _, doc := range docs {
		if len(doc.Content) < 500 {
			summarizedDocs = append(summarizedDocs, doc)
			continue
		}

		prompt := fmt.Sprintf(`You are a precise facts extractor. Read the following source document and extract key factual points relevant to the query: %q.
Keep the extraction extremely concise, returning only the direct facts as a bulleted list. Keep it under 200 words total. Do not add any conversational text.

Document Title: %s
Content:
%s`, query, doc.Title, doc.Content)

		messages := []llm.Message{
			{Role: "user", Content: prompt},
		}

		log.Printf("[Synthesizer Batch] Digesting source: %q (length: %d)...", doc.Title, len(doc.Content))
		summary, err := s.llmClient.Generate(ctx, messages)
		if err != nil {
			log.Printf("[Synthesizer Batch] Warning: failed to digest %q: %v", doc.Title, err)
			runes := []rune(doc.Content)
			if len(runes) > 1000 {
				doc.Content = string(runes[:1000]) + "... [Truncated]"
			}
			summarizedDocs = append(summarizedDocs, doc)
			continue
		}

		doc.Content = summary
		summarizedDocs = append(summarizedDocs, doc)
	}

	return summarizedDocs
}
