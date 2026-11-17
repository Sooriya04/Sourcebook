package api

import (
	"fmt"
	"sourcebook/internal/models"
	"sourcebook/internal/synthesis"
	"strings"
)

type StudyRequest struct {
	NotebookID string `json:"notebook_id"`
}

func (a *API) fetchStudyDocuments(notebookID string) ([]synthesis.ScrapedDoc, error) {
	if a.repo == nil {
		return nil, fmt.Errorf("repository not initialized")
	}

	chunks, err := a.repo.GetChunksByNotebook(notebookID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve chunks: %w", err)
	}

	sources, err := a.repo.GetSourcesByNotebook(notebookID)
	if err != nil {
		return nil, fmt.Errorf("failed to retrieve sources: %w", err)
	}

	sourceMap := make(map[string]models.SourceRecord)
	for _, src := range sources {
		sourceMap[src.ID] = src
	}

	var docs []synthesis.ScrapedDoc
	if len(chunks) > 0 {
		chunksBySource := make(map[string][]models.DocumentChunk)
		for _, c := range chunks {
			chunksBySource[c.SourceID] = append(chunksBySource[c.SourceID], c)
		}

		limit := 15
		count := 0
		maxPerSource := 15
		for pass := 0; pass < maxPerSource && count < limit; pass++ {
			for srcID, srcChunks := range chunksBySource {
				if pass < len(srcChunks) {
					c := srcChunks[pass]
					title := "Untitled Source"
					if src, ok := sourceMap[srcID]; ok {
						title = src.Title
					}
					docs = append(docs, synthesis.ScrapedDoc{
						Title:   title,
						Content: c.Content,
					})
					count++
					if count >= limit {
						break
					}
				}
			}
		}
	} else {
		for _, src := range sources {
			if strings.TrimSpace(src.Content) != "" {
				docs = append(docs, synthesis.ScrapedDoc{
					Title:   src.Title,
					Content: src.Content,
				})
				if len(docs) >= 5 {
					break
				}
			}
		}
	}

	return docs, nil
}

func extractJSON(raw, openChar, closeChar string) string {
	cleaned := strings.TrimSpace(raw)
	if first := strings.Index(cleaned, openChar); first != -1 {
		if last := strings.LastIndex(cleaned, closeChar); last > first {
			return cleaned[first : last+1]
		}
	}
	cleaned = strings.TrimPrefix(cleaned, "```json")
	cleaned = strings.TrimPrefix(cleaned, "```")
	cleaned = strings.TrimSuffix(cleaned, "```")
	return strings.TrimSpace(cleaned)
}
