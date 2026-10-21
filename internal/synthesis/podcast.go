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
	return s.GeneratePodcastDialogueWithOptions(ctx, docs, llm.PodcastOptions{})
}

// GeneratePodcastDialogueWithOptions generates dialogue with custom length, tone, and focus options.
func (s *Synthesizer) GeneratePodcastDialogueWithOptions(ctx context.Context, docs []ScrapedDoc, opts llm.PodcastOptions) (string, error) {
	var docContexts []llm.DocumentContext
	for i, d := range docs {
		content := strings.TrimSpace(d.Content)
		runes := []rune(content)
		if len(runes) > 1500 {
			content = string(runes[:1500]) + "... [Truncated for overview]"
		}
		docContexts = append(docContexts, llm.DocumentContext{
			Index:   i + 1,
			Title:   d.Title,
			Content: content,
		})
		if len(docContexts) >= 6 {
			break
		}
	}

	messages := llm.BuildPodcastPromptWithOptions(docContexts, opts)

	log.Printf("[Synthesizer] Generating 2-host dialogue (format=%s, length=%s, sources=%d)...", opts.Format, opts.Length, len(docContexts))
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
