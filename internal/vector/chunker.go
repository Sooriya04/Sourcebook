package vector

import (
	"strings"
)

// ChunkText splits text into paragraphs and sentences to approximate chunkSize characters.
func ChunkText(text string, chunkSize int) []string {
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
