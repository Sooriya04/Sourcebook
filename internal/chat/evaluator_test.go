package chat

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"sourcebook/internal/vector"
	"sync/atomic"
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

func TestSelfEvaluator_BatchEmbedding(t *testing.T) {
	var requestCount int32
	var embeddedTextCount int32

	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		atomic.AddInt32(&requestCount, 1)
		var body struct {
			Texts []string `json:"texts"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		atomic.AddInt32(&embeddedTextCount, int32(len(body.Texts)))

		// Return mock embeddings for each input text
		embs := make([][]float32, len(body.Texts))
		for i := range embs {
			embs[i] = []float32{1.0, 0.0}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"embeddings": embs,
			"dimension":  2,
		})
	}))
	defer mockServer.Close()

	vc := vector.NewClient()
	vc.SetConfig(mockServer.URL, "test-model")
	evaluator := NewSelfEvaluator(vc)

	docs := []Document{
		{
			Title:   "Doc 1",
			Content: "Machine learning neural networks gradient descent.",
		},
		{
			Title:   "Doc 2",
			Content: "Computer vision convolutional models image classification.",
		},
	}

	res, err := evaluator.EvaluateContext(context.Background(), "machine learning", docs)
	if err != nil {
		t.Fatalf("EvaluateContext failed: %v", err)
	}

	if res == nil || len(res.RelevantDocs) == 0 {
		t.Fatalf("expected relevant docs from evaluation, got %v", res)
	}

	// 1 call for query embedding + 1 single batch call for both docs = 2 total HTTP calls
	// (instead of 1 call for query + 2 sequential doc calls = 3 HTTP calls)
	if totalReqs := atomic.LoadInt32(&requestCount); totalReqs != 2 {
		t.Errorf("expected exactly 2 HTTP embedding requests (1 query + 1 batch), got %d", totalReqs)
	}

	// 1 text for query + 2 texts in the batch = 3 texts total embedded
	if totalTexts := atomic.LoadInt32(&embeddedTextCount); totalTexts != 3 {
		t.Errorf("expected 3 texts embedded in total, got %d", totalTexts)
	}
}
