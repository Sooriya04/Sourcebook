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
	if first := strings.Index(trimmed, "["); first != -1 {
		if last := strings.LastIndex(trimmed, "]"); last > first {
			trimmed = trimmed[first : last+1]
		}
	}

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

// ResolveQuery contextualizes follow-up queries using recent conversation history turns.
func (qp *QueryPlanner) ResolveQuery(ctx context.Context, query string, history []llm.Message) (string, error) {
	if qp.llmClient == nil || len(history) == 0 {
		return query, nil
	}

	trimmed := strings.TrimSpace(query)
	lower := strings.ToLower(trimmed)
	words := strings.Fields(lower)
	hasPronouns := false
	pronounTriggers := []string{"it", "its", "they", "them", "their", "this", "that", "these", "those", "former", "latter", "first", "second", "why", "how", "what about", "compare", "more"}
	for _, w := range words {
		for _, trig := range pronounTriggers {
			if w == trig {
				hasPronouns = true
				break
			}
		}
		if hasPronouns {
			break
		}
	}

	if len(words) > 12 && !hasPronouns {
		return query, nil
	}

	startIdx := 0
	if len(history) > 4 {
		startIdx = len(history) - 4
	}
	var histBuilder strings.Builder
	for i := startIdx; i < len(history); i++ {
		msg := history[i]
		role := "User"
		if msg.Role == "assistant" {
			role = "Assistant"
		}
		content := msg.Content
		if len(content) > 250 {
			content = content[:250] + "..."
		}
		histBuilder.WriteString(fmt.Sprintf("%s: %s\n", role, content))
	}

	prompt := fmt.Sprintf(`Given the recent conversation turns and the user's latest query, rewrite the latest query into a single standalone, self-contained search query that resolves all pronouns and context.
Do NOT answer the question. Return ONLY the rewritten query text. If already standalone, return it unchanged.

Conversation:
%s
Latest Query: %q
Standalone Query:`, histBuilder.String(), trimmed)

	rawRes, err := qp.llmClient.Generate(ctx, []llm.Message{{Role: "user", Content: prompt}})
	if err != nil {
		log.Printf("[QueryPlanner] Error resolving query context: %v. Using original query.", err)
		return query, nil
	}

	resolved := strings.TrimSpace(rawRes)
	resolved = strings.Trim(resolved, `"'`+"`")
	if resolved == "" {
		return query, nil
	}

	log.Printf("[QueryPlanner] Contextualized query %q -> %q", query, resolved)
	return resolved, nil
}

