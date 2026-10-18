package vector

import (
	"strings"
)

// DefaultChunkSize is the optimized target character size per chunk (~200 words).
const DefaultChunkSize = 1200

// MaxChunksPerDoc is the maximum number of chunks generated per document to prevent memory/CPU spikes.
const MaxChunksPerDoc = 35

// ChunkText splits text into paragraphs and sentences to approximate chunkSize characters.
// If chunkSize <= 0, DefaultChunkSize is used.
func ChunkText(text string, chunkSize int) []string {
	if chunkSize <= 0 {
		chunkSize = DefaultChunkSize
	}
	paragraphs := strings.Split(text, "\n\n")
	var chunks []string
	currentChunk := ""

	for _, p := range paragraphs {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		if len(currentChunk)+len(p)+2 <= chunkSize {
			if currentChunk != "" {
				currentChunk += "\n\n"
			}
			currentChunk += p
		} else {
			if currentChunk != "" {
				chunks = append(chunks, currentChunk)
			}
			if len(p) > chunkSize {
				sentences := strings.Split(p, ". ")
				curr := ""
				for _, s := range sentences {
					if len(curr)+len(s)+1 <= chunkSize {
						if curr != "" {
							curr += ". "
						}
						curr += s
					} else {
						if curr != "" {
							chunks = append(chunks, curr)
						}
						curr = s
					}
				}
				currentChunk = curr
			} else {
				currentChunk = p
			}
		}
	}
	if currentChunk != "" {
		chunks = append(chunks, currentChunk)
	}
	return chunks
}

// ChunkTextBounded splits text into chunks of at most chunkSize characters, capped at maxChunks.
// If the document produces more chunks than maxChunks, it prioritizes critical sections:
// the beginning (context and introduction) and end (conclusions and summary).
func ChunkTextBounded(text string, chunkSize int, maxChunks int) []string {
	if chunkSize <= 0 {
		chunkSize = DefaultChunkSize
	}
	if maxChunks <= 0 {
		maxChunks = MaxChunksPerDoc
	}

	chunks := ChunkText(text, chunkSize)
	if len(chunks) <= maxChunks {
		return chunks
	}

	// Prioritize critical sections: head (context & overview) and tail (conclusions & results)
	tail := (maxChunks * 3) / 10
	if tail < 1 && maxChunks > 1 {
		tail = 1
	}
	head := maxChunks - tail

	bounded := make([]string, 0, maxChunks)
	bounded = append(bounded, chunks[:head]...)
	bounded = append(bounded, chunks[len(chunks)-tail:]...)
	return bounded
}
