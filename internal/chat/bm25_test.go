package chat

import (
	"testing"
)

func TestTokenize(t *testing.T) {
	text := "Hello World! This is BM25, tested in 2026."
	tokens := Tokenize(text)
	if len(tokens) != 8 {
		t.Fatalf("expected 8 tokens, got %d: %v", len(tokens), tokens)
	}
	if tokens[0] != "hello" || tokens[4] != "bm25" {
		t.Errorf("unexpected tokens: %v", tokens)
	}
}

func TestCalculateBM25(t *testing.T) {
	docs := []Document{
		{Title: "Go Programming", Content: "Go is an open-source programming language supported by Google."},
		{Title: "Python Overview", Content: "Python is a popular language for artificial intelligence and data science."},
		{Title: "Go Concurrency", Content: "Go handles concurrency using goroutines and channels efficiently."},
	}

	query := "Go programming language"
	scores := CalculateBM25(query, docs)

	if len(scores) != len(docs) {
		t.Fatalf("expected %d scores, got %d", len(docs), len(scores))
	}

	if scores[0] <= 0 {
		t.Errorf("doc 0 should have high score for query %q, got %f", query, scores[0])
	}
	if scores[0] <= scores[1] {
		t.Errorf("doc 0 (%f) should rank higher than doc 1 (%f)", scores[0], scores[1])
	}
}
