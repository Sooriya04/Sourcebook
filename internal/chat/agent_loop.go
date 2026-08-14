package chat

import (
	"context"
	"fmt"
	"log"
	"sourcebook/internal/vector"
)

type AgentLoop struct {
	evaluator *SelfEvaluator
	tools     *ToolRegistry
}

func NewAgentLoop(vc *vector.Client, retriever *Retriever) *AgentLoop {
	return &AgentLoop{
		evaluator: NewSelfEvaluator(vc),
		tools:     NewToolRegistry(retriever),
	}
}

// RunExecuteOrAugment evaluates initial docs and executes web fallback search if context is insufficient.
func (al *AgentLoop) RunExecuteOrAugment(
	ctx context.Context,
	query string,
	initialDocs []Document,
	mode string,
	onStatus func(string),
) ([]Document, error) {
	if onStatus != nil {
		onStatus("Evaluating source relevance and quality...")
	}

	// 1. Evaluate initial documents
	eval, err := al.evaluator.EvaluateContext(ctx, query, initialDocs)
	if err != nil {
		log.Printf("[AgentLoop] Context evaluation warning: %v", err)
		eval = &EvaluationResult{
			RelevantDocs: initialDocs,
			Sufficient:   len(initialDocs) > 0,
		}
	}

	// 2. If initial docs are sufficient, return relevant subset
	if eval.Sufficient && len(eval.RelevantDocs) > 0 {
		if onStatus != nil {
			onStatus(fmt.Sprintf("Sufficient context verified (%d high-relevance sources)", len(eval.RelevantDocs)))
		}
		return eval.RelevantDocs, nil
	}

	// 3. Fallback: Context is insufficient or empty -> Auto-trigger agent tool
	searchQuery := query
	if eval.SuggestedSubQuery != "" {
		searchQuery = eval.SuggestedSubQuery
	}

	if onStatus != nil {
		onStatus(fmt.Sprintf("Context gap detected (avg score %.2f) → Auto-triggering web discovery for %q", eval.AverageScore, searchQuery))
	}

	log.Printf("[AgentLoop] Triggering web search tool fallback for %q", searchQuery)
	webDocs, err := al.tools.ToolWebSearch(ctx, searchQuery, 5)
	if err != nil {
		log.Printf("[AgentLoop] ToolWebSearch failed: %v", err)
		return eval.RelevantDocs, nil
	}

	// 4. Merge initial docs + newly fetched web docs & deduplicate
	combined := append(eval.RelevantDocs, webDocs...)
	finalDocs := Deduplicate(combined)

	if onStatus != nil {
		onStatus(fmt.Sprintf("Augmented context with %d live web sources", len(webDocs)))
	}

	return finalDocs, nil
}
