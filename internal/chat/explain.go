package chat

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"

	"sourcebook/internal/llm"
	"sourcebook/internal/utils"
)

// HandleExplainQuery detects if the query is an "Explain Source" query, finds the matched source, and returns it.
func (c *Controller) HandleExplainQuery(ctx context.Context, query string, notebookID string, docs []Document) ([]Document, bool) {
	isExplainQuery := strings.Contains(strings.ToLower(query), "explain this source in detail:")
	if !isExplainQuery {
		return docs, false
	}

	startQuote := strings.Index(query, "\"")
	endQuote := strings.LastIndex(query, "\"")
	var targetTitle string
	if startQuote != -1 && endQuote > startQuote {
		targetTitle = query[startQuote+1 : endQuote]
	}

	var targetIndex int = -1
	startBracket := strings.LastIndex(query, "[")
	endBracket := strings.LastIndex(query, "]")
	if startBracket != -1 && endBracket > startBracket {
		idxStr := query[startBracket+1 : endBracket]
		if idx, err := strconv.Atoi(idxStr); err == nil {
			targetIndex = idx
		}
	}

	var matched *Document
	var matchedIndex int = -1

	if notebookID != "" && c.repo != nil {
		allSources, err := c.repo.GetSourcesByNotebook(notebookID)
		if err == nil && len(allSources) > 0 {
			if targetIndex != -1 && targetIndex-1 < len(allSources) && targetIndex-1 >= 0 {
				src := allSources[targetIndex-1]
				matched = &Document{
					Title:      src.Title,
					URL:        src.URL,
					Content:    src.Content,
					SourceType: src.Type,
				}
				matchedIndex = targetIndex
			}

			if matched == nil && targetTitle != "" {
				for i, src := range allSources {
					if strings.Contains(strings.ToLower(src.Title), strings.ToLower(targetTitle)) || strings.Contains(strings.ToLower(targetTitle), strings.ToLower(src.Title)) {
						matched = &Document{
							Title:      src.Title,
							URL:        src.URL,
							Content:    src.Content,
							SourceType: src.Type,
						}
						matchedIndex = i + 1
						break
					}
				}
			}

			if matched != nil && matchedIndex != -1 {
				contentRunes := []rune(matched.Content)
				if len(contentRunes) > 12000 {
					matched.Content = string(contentRunes[:12000]) + "... [Truncated]"
				}
				matched.Index = matchedIndex
				log.Printf("[ChatController] HandleExplainQuery: Successfully matched source %q at index %d", matched.Title, matchedIndex)
				return []Document{*matched}, true
			}
		}
	}

	if matched == nil {
		for _, doc := range docs {
			if targetTitle != "" && (strings.Contains(strings.ToLower(doc.Title), strings.ToLower(targetTitle)) || strings.Contains(strings.ToLower(targetTitle), strings.ToLower(doc.Title))) {
				matched = &doc
				break
			}
		}
	}

	if matched != nil {
		contentRunes := []rune(matched.Content)
		if len(contentRunes) > 12000 {
			matched.Content = string(contentRunes[:12000]) + "... [Truncated]"
		}
		log.Printf("[ChatController] HandleExplainQuery: Successfully matched source %q via fallback", matched.Title)
		return []Document{*matched}, true
	}

	return docs, false
}

// BatchAndSummarize processes documents one by one to extract query-relevant information.
func (c *Controller) BatchAndSummarize(ctx context.Context, query string, docs []Document, onStatus func(string)) []Document {
	var summarizedDocs []Document

	for i, doc := range docs {
		cleaned := utils.CleanText(doc.Content)
		if len(cleaned) < 500 {
			doc.Content = cleaned
			summarizedDocs = append(summarizedDocs, doc)
			continue
		}

		if onStatus != nil {
			onStatus(fmt.Sprintf("Digesting source %d/%d: %s...", i+1, len(docs), doc.Title))
		}

		prompt := fmt.Sprintf(`You are a precise facts extractor. Read the following source document and extract key factual points relevant to the query: %q.
Keep the extraction extremely concise, returning only the direct facts as a bulleted list. Keep it under 200 words total. Do not add any conversational text.

Document Title: %s
Content:
%s`, query, doc.Title, cleaned)

		messages := []llm.Message{
			{Role: "user", Content: prompt},
		}

		summary, err := c.llmClient.Generate(ctx, messages)
		if err != nil {
			log.Printf("[BatchAndSummarize] Warning: failed to digest %q: %v", doc.Title, err)
			runes := []rune(cleaned)
			if len(runes) > 1000 {
				doc.Content = string(runes[:1000]) + "... [Truncated]"
			} else {
				doc.Content = cleaned
			}
			summarizedDocs = append(summarizedDocs, doc)
			continue
		}

		doc.Content = summary
		summarizedDocs = append(summarizedDocs, doc)
	}

	return summarizedDocs
}
