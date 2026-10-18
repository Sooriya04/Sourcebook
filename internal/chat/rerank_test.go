package chat

import (
	"context"
	"testing"
)

func TestDeduplicate_PreservesDistinctChunks(t *testing.T) {
	docs := []Document{
		{
			Title:      "Kokoro TTS Architecture",
			URL:        "https://example.com/kokoro",
			Content:    "Chunk 1: Kokoro is an 82M parameter lightweight text to speech model.",
			SourceType: "Notebook",
		},
		{
			Title:      "Kokoro TTS Architecture",
			URL:        "https://example.com/kokoro",
			Content:    "Chunk 2: The architecture supports float32 tensor speed and custom voices.",
			SourceType: "Notebook",
		},
		{
			Title:      "Duplicate Web Page",
			URL:        "https://example.com/page",
			Content:    "This is an article about artificial intelligence.",
			SourceType: "Web",
		},
		{
			Title:      "Duplicate Web Page Re-hit",
			URL:        "https://example.com/page",
			Content:    "This is an article about artificial intelligence identical snippet.",
			SourceType: "Web",
		},
	}

	deduped := Deduplicate(docs)
	// We expect 3 docs: Chunk 1, Chunk 2 (both kept despite identical title & URL), and 1 web doc
	if len(deduped) != 3 {
		t.Fatalf("expected 3 deduped docs, got %d", len(deduped))
	}

	if deduped[0].Content != docs[0].Content || deduped[1].Content != docs[1].Content {
		t.Errorf("expected both notebook chunks to be preserved")
	}
}

func TestReranker_RRF_PrecomputedEmbeddings(t *testing.T) {
	reranker := NewReranker(nil)

	// Simulated query: [1.0, 0.0]
	// Doc 0: Vector matches query perfectly [1.0, 0.0], low keyword overlap
	// Doc 1: Exact keyword match "transformer architecture", vector orthogonal [0.0, 1.0]
	// Doc 2: Irrelevant doc
	docs := []Document{
		{
			Title:     "Semantic Match",
			Content:   "Deep learning neural representations of acoustic features.",
			Embedding: []float32{1.0, 0.0},
		},
		{
			Title:     "Keyword Match",
			Content:   "Transformer architecture neural network implementation.",
			Embedding: []float32{0.0, 1.0},
		},
		{
			Title:     "Irrelevant Doc",
			Content:   "Cooking pasta with tomato sauce and olive oil.",
			Embedding: []float32{-1.0, -1.0},
		},
	}

	// When vector client is nil, it falls back to BM25-only without crashing
	res, err := reranker.Rerank(context.Background(), "transformer architecture", docs, 2)
	if err != nil {
		t.Fatalf("Rerank failed: %v", err)
	}

	if len(res) != 2 {
		t.Fatalf("expected 2 results, got %d", len(res))
	}

	if res[0].Title != "Keyword Match" {
		t.Errorf("expected Keyword Match to rank first under BM25-only fallback, got %s", res[0].Title)
	}
}
