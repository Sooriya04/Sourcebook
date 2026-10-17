package synthesis

import (
	"context"
	"fmt"
	"log"
	"sourcebook/internal/llm"
	"strings"
)

// GeneratePodcastDialogue generates a 2-host audio podcast dialogue from source docs.
func (s *Synthesizer) GeneratePodcastDialogue(ctx context.Context, docs []ScrapedDoc) (string, error) {
	var docContexts []llm.DocumentContext
	for i, d := range docs {
		docContexts = append(docContexts, llm.DocumentContext{
			Index:   i + 1,
			Title:   d.Title,
			Content: d.Content,
		})
	}

	docContexts = s.BatchAndSummarize(ctx, "core concepts, main findings, and overview", docContexts)
	messages := llm.BuildPodcastPrompt(docContexts)

	log.Printf("[Synthesizer] Calling LLM engine for 2-host podcast dialogue...")
	answer, err := s.llmClient.Generate(ctx, messages)
	if err != nil {
		return "", fmt.Errorf("LLM podcast dialogue error: %w", err)
	}

	answer = strings.TrimSpace(answer)
	if strings.HasPrefix(answer, "```json") {
		answer = strings.TrimPrefix(answer, "```json")
	} else if strings.HasPrefix(answer, "```") {
		answer = strings.TrimPrefix(answer, "```")
	}
	if strings.HasSuffix(answer, "```") {
		answer = strings.TrimSuffix(answer, "```")
	}

	return strings.TrimSpace(answer), nil
}
