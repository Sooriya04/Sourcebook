package chat

import (
	"context"
	"testing"
)

func TestSelfEvaluator_PrecomputedEmbedding(t *testing.T) {
	evaluator := NewSelfEvaluator(nil) // vectorClient is nil, so it relies on precomputed embedding or keyword fallback

	docs := []Document{
		{
			Title:     "Quantum Computing",
			Content:   "Qubits superposition entanglement quantum algorithms.",
			Embedding: []float32{1.0, 0.0},
		},
	}

	// Evaluate context with query matching precomputed embedding
	res, err := evaluator.EvaluateContext(context.Background(), "quantum computing", docs)
	if err != nil {
		t.Fatalf("EvaluateContext failed: %v", err)
	}

	if res == nil {
		t.Fatalf("expected evaluation result, got nil")
	}
}
