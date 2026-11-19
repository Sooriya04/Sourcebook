package synthesis

import (
	"context"
	"fmt"
	"log"
	"sourcebook/internal/llm"
	"sourcebook/internal/utils"
)

func (s *Synthesizer) docContextsFromScraped(docs []ScrapedDoc) []llm.DocumentContext {
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
	return docContexts
}

// GenerateQuiz generates a 5-question multiple choice quiz.
func (s *Synthesizer) GenerateQuiz(ctx context.Context, docs []ScrapedDoc) (string, error) {
	docContexts := s.docContextsFromScraped(docs)
	if len(docContexts) == 0 {
		return "[]", nil
	}

	log.Printf("[Synthesizer] Digesting %d documents for quiz generation...", len(docContexts))
	docContexts = s.BatchAndSummarize(ctx, "Key factual concepts, principles, and mechanisms for multiple choice quiz", docContexts)

	messages := llm.BuildQuizPrompt(docContexts)
	answer, err := s.llmClient.Generate(ctx, messages)
	if err != nil {
		return "", fmt.Errorf("LLM quiz error: %w", err)
	}
	return answer, nil
}

// GenerateFAQ generates 5 FAQs based on workspace materials.
func (s *Synthesizer) GenerateFAQ(ctx context.Context, docs []ScrapedDoc) (string, error) {
	docContexts := s.docContextsFromScraped(docs)
	if len(docContexts) == 0 {
		return "[]", nil
	}

	log.Printf("[Synthesizer] Digesting %d documents for FAQ generation...", len(docContexts))
	docContexts = s.BatchAndSummarize(ctx, "Common questions, core concepts, and operational answers", docContexts)

	messages := llm.BuildFAQPrompt(docContexts)
	answer, err := s.llmClient.Generate(ctx, messages)
	if err != nil {
		return "", fmt.Errorf("LLM FAQ error: %w", err)
	}
	return answer, nil
}

// GenerateBriefing generates an executive briefing document.
func (s *Synthesizer) GenerateBriefing(ctx context.Context, docs []ScrapedDoc) (string, error) {
	docContexts := s.docContextsFromScraped(docs)
	if len(docContexts) == 0 {
		return "{}", nil
	}

	log.Printf("[Synthesizer] Digesting %d documents for briefing generation...", len(docContexts))
	docContexts = s.BatchAndSummarize(ctx, "Executive summary, definitions of core terms, and research questions", docContexts)

	messages := llm.BuildBriefingPrompt(docContexts)
	answer, err := s.llmClient.Generate(ctx, messages)
	if err != nil {
		return "", fmt.Errorf("LLM briefing error: %w", err)
	}
	return answer, nil
}

// GenerateMindMap generates a hierarchical concept tree for the notebook sources.
func (s *Synthesizer) GenerateMindMap(ctx context.Context, docs []ScrapedDoc) (string, error) {
	docContexts := s.docContextsFromScraped(docs)
	if len(docContexts) == 0 {
		return "{}", nil
	}

	log.Printf("[Synthesizer] Digesting %d documents for mind map generation...", len(docContexts))
	docContexts = s.BatchAndSummarize(ctx, "Hierarchical concept structure, core topics, subtopics, and key definitions", docContexts)

	messages := llm.BuildMindMapPrompt(docContexts)
	answer, err := s.llmClient.Generate(ctx, messages)
	if err != nil {
		return "", fmt.Errorf("LLM mind map error: %w", err)
	}
	return answer, nil
}
