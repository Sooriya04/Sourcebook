package chat

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"sourcebook/internal/llm"
	"strings"
)

type QueryPlanner struct {
	llmClient *llm.Client
}

func NewQueryPlanner(client *llm.Client) *QueryPlanner {
	return &QueryPlanner{
		llmClient: client,
	}
}

// Decompose breaks down a complex user query into 2-4 simpler, targeted search sub-queries.
func (qp *QueryPlanner) Decompose(ctx context.Context, query string) ([]string, error) {
	if qp.llmClient == nil {
		return []string{query}, nil
	}

	prompt := fmt.Sprintf(`Decompose the following complex research query into 2 to 4 simple, focused sub-queries for document search.
Return ONLY a valid JSON array of strings containing the sub-queries. Do not add any markdown formatting, bullet points, numbering, or introductory/concluding text.

Example Output:
["VLM multi-step reasoning methods", "2025 Vision-Language-Action benchmarks"]

Query: %q`, query)

	messages := []llm.Message{
		{
			Role:    "user",
			Content: prompt,
		},
	}

	rawRes, err := qp.llmClient.Generate(ctx, messages)
	if err != nil {
		log.Printf("[QueryPlanner] Error generating sub-queries: %v. Falling back to single query.", err)
		return []string{query}, nil
	}

	trimmed := strings.TrimSpace(rawRes)
	if strings.HasPrefix(trimmed, "```json") {
		trimmed = strings.TrimPrefix(trimmed, "```json")
		trimmed = strings.TrimSuffix(trimmed, "```")
	} else if strings.HasPrefix(trimmed, "```") {
		trimmed = strings.TrimPrefix(trimmed, "```")
		trimmed = strings.TrimSuffix(trimmed, "```")
	}
	trimmed = strings.TrimSpace(trimmed)

	var subQueries []string
	if err := json.Unmarshal([]byte(trimmed), &subQueries); err != nil {
		log.Printf("[QueryPlanner] Failed to parse decomposed query JSON: %q. Error: %v. Falling back to original query.", trimmed, err)
		return []string{query}, nil
	}

	// Filter empty queries
	var cleaned []string
	for _, q := range subQueries {
		q = strings.TrimSpace(q)
		if q != "" {
			cleaned = append(cleaned, q)
		}
	}

	if len(cleaned) == 0 {
		return []string{query}, nil
	}

	log.Printf("[QueryPlanner] Decomposed %q -> %v", query, cleaned)
	return cleaned, nil
}
