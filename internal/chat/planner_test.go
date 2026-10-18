package chat

import (
	"context"
	"testing"

	"sourcebook/internal/llm"
)

func TestQueryPlanner_StandaloneHeuristic(t *testing.T) {
	planner := NewQueryPlanner(nil)

	// Standalone query without pronouns
	query := "What is the capital city of Australia and its population density?"
	history := []llm.Message{
		{Role: "user", Content: "Tell me about France."},
		{Role: "assistant", Content: "Paris is the capital of France."},
	}

	// Should return query directly without LLM call because it's >12 words and has no referential pronouns
	res, err := planner.ResolveQuery(context.Background(), query, history)
	if err != nil {
		t.Fatalf("ResolveQuery failed: %v", err)
	}

	if res != query {
		t.Errorf("expected unchanged query %q, got %q", query, res)
	}
}

func TestQueryPlanner_NilClientFallback(t *testing.T) {
	planner := NewQueryPlanner(nil)

	query := "How does it compare?"
	history := []llm.Message{
		{Role: "user", Content: "Kokoro TTS is fast."},
		{Role: "assistant", Content: "Yes, Kokoro 82M is very lightweight."},
	}

	// When LLM client is nil, it should safely fall back to query
	res, err := planner.ResolveQuery(context.Background(), query, history)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if res != query {
		t.Errorf("expected fallback query %q, got %q", query, res)
	}
}
