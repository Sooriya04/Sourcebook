package chat

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"

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

// BatchAndSummarize cleans and normalizes document content, ensuring each document is sized appropriately for LLM context without losing source fidelity.
func (c *Controller) BatchAndSummarize(ctx context.Context, query string, docs []Document, onStatus func(string)) []Document {
	var preparedDocs []Document

	for i, doc := range docs {
		cleaned := utils.CleanText(doc.Content)
		if cleaned == "" {
			cleaned = utils.CleanText(doc.Title)
		}

		if onStatus != nil {
			onStatus(fmt.Sprintf("Preparing source %d/%d: %s...", i+1, len(docs), doc.Title))
		}

		// Keep up to 6000 runes per document so full authentic content is fed to synthesis
		runes := []rune(cleaned)
		if len(runes) > 6000 {
			doc.Content = string(runes[:6000]) + "\n\n... [Content truncated for context limits]"
		} else {
			doc.Content = cleaned
		}
		preparedDocs = append(preparedDocs, doc)
	}

	return preparedDocs
}
