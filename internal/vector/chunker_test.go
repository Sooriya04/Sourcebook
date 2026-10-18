package vector

import (
	"fmt"
	"strings"
	"testing"
)

func TestChunkText_BackwardsCompatibility(t *testing.T) {
	// Preserves explicit chunk size behavior
	text := "Sentence one. Sentence two. Sentence three. Sentence four."
	chunks := ChunkText(text, 25)
	if len(chunks) < 2 {
		t.Fatalf("Expected multiple chunks for small size, got %d", len(chunks))
	}

	// Falls back to DefaultChunkSize (1200) when chunkSize <= 0
	shortText := "Short text paragraph."
	defaultChunks := ChunkText(shortText, 0)
	if len(defaultChunks) != 1 || defaultChunks[0] != shortText {
		t.Fatalf("Expected 1 chunk with default size, got %v", defaultChunks)
	}
}

func TestChunkTextBounded_CappingAndPrioritization(t *testing.T) {
	// Build a document with 50 distinct paragraphs
	paragraphs := make([]string, 50)
	for i := 0; i < 50; i++ {
		paragraphs[i] = fmt.Sprintf("Paragraph %02d content is detailed here.", i+1)
	}
	doc := strings.Join(paragraphs, "\n\n")

	// Verify that ChunkText generates 50 chunks when chunkSize is small enough
	unbounded := ChunkText(doc, 60)
	if len(unbounded) != 50 {
		t.Fatalf("Expected 50 unbounded chunks, got %d", len(unbounded))
	}

	// Test bounded to 35 chunks
	maxChunks := 35
	bounded := ChunkTextBounded(doc, 60, maxChunks)
	if len(bounded) != maxChunks {
		t.Fatalf("Expected exactly %d chunks, got %d", maxChunks, len(bounded))
	}

	// Tail is 35 * 3 / 10 = 10, Head is 25
	// Verify head begins with Paragraph 01
	if !strings.HasPrefix(bounded[0], "Paragraph 01") {
		t.Errorf("Expected first chunk to be Paragraph 01, got %q", bounded[0])
	}
	if !strings.HasPrefix(bounded[24], "Paragraph 25") {
		t.Errorf("Expected 25th chunk to be Paragraph 25, got %q", bounded[24])
	}

	// Verify tail ends with Paragraph 50
	if !strings.HasPrefix(bounded[34], "Paragraph 50") {
		t.Errorf("Expected last chunk to be Paragraph 50, got %q", bounded[34])
	}
	if !strings.HasPrefix(bounded[25], "Paragraph 41") {
		t.Errorf("Expected start of tail (26th chunk) to be Paragraph 41, got %q", bounded[25])
	}
}

func TestChunkTextBounded_UnderLimit(t *testing.T) {
	doc := "Para 1\n\nPara 2\n\nPara 3"
	chunks := ChunkTextBounded(doc, 1200, 35)
	if len(chunks) != 1 {
		t.Fatalf("Expected 1 chunk since total text fits in 1200 chars, got %d", len(chunks))
	}
}

func TestChunkTextBounded_Defaults(t *testing.T) {
	doc := "Some sample text."
	chunks := ChunkTextBounded(doc, 0, 0)
	if len(chunks) != 1 || chunks[0] != doc {
		t.Fatalf("Expected default chunking to return 1 chunk, got %v", chunks)
	}
}
