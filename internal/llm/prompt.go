package llm

import (
	"fmt"
	"strings"
)

// DocumentContext represents a scraped document fed to the LLM.
type DocumentContext struct {
	Index   int
	Title   string
	URL     string
	Content string
}

// BuildPrompt constructs a grounded system and user prompt with source context.
func BuildPrompt(query string, docs []DocumentContext) ([]Message, []SourceCitation) {
	var contextBuilder strings.Builder
	var citations []SourceCitation

	for _, doc := range docs {
		idx := doc.Index
		citations = append(citations, SourceCitation{
			Index: idx,
			Title: doc.Title,
			URL:   doc.URL,
		})

		contextBuilder.WriteString(fmt.Sprintf("[%d] Source: %s\nURL: %s\nContent:\n%s\n\n---\n\n",
			idx, doc.Title, doc.URL, doc.Content))
	}

	systemPrompt := `You are SourceBook, an intelligent Internet Knowledge Engine.
Your task is to provide a clear, accurate, and comprehensive answer to the user's query using ONLY the provided search source context.

Rules:
1. Base your answer strictly on the provided sources. Do not make up facts.
2. Use inline numerical citations like [1], [2] to indicate where facts come from.
3. If the sources do not contain enough information to answer, state what is missing clearly.
4. Keep the output clean, structured, and easy to read.`

	userPrompt := fmt.Sprintf("User Query: %s\n\nSearch Context:\n%s\nProvide a comprehensive grounded answer with inline citations [1], [2], etc.",
		query, contextBuilder.String())

	messages := []Message{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: userPrompt},
	}

	return messages, citations
}
