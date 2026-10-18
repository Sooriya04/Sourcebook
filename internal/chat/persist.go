package chat

import (
	"context"
	"strings"
	"time"

	"sourcebook/internal/models"

	"github.com/google/uuid"
)

// PersistNewSources checks for newly discovered web/arxiv documents and adds them to the notebook database.
func (c *Controller) PersistNewSources(ctx context.Context, notebookID string, docs []Document) []models.SourceRecord {
	if notebookID == "" || c.repo == nil || c.vectorClient == nil {
		return nil
	}

	existingSources, err := c.repo.GetSourcesByNotebook(notebookID)
	if err != nil {
		return nil
	}

	existingURLs := make(map[string]bool)
	for _, s := range existingSources {
		existingURLs[strings.ToLower(strings.TrimSpace(s.URL))] = true
		existingURLs[strings.ToLower(strings.TrimSpace(s.CanonicalURL))] = true
	}

	var newSources []models.SourceRecord
	for _, d := range docs {
		if d.SourceType == "Notebook" {
			continue
		}
		urlKey := strings.ToLower(strings.TrimSpace(d.URL))
		if urlKey == "" || existingURLs[urlKey] {
			continue
		}

		src := models.SourceRecord{
			ID:           uuid.NewString(),
			NotebookID:   notebookID,
			Title:        d.Title,
			URL:          d.URL,
			CanonicalURL: d.URL,
			Content:      d.Content,
			Provider:     d.SourceType,
			Type:         d.SourceType,
		}

		if err := c.repo.AddSource(&src); err != nil {
			continue
		}
		newSources = append(newSources, src)
		existingURLs[urlKey] = true
	}

	if len(newSources) > 0 {
		go func(sources []models.SourceRecord) {
			bgCtx, cancel := context.WithTimeout(context.Background(), 3*time.Minute)
			defer cancel()

			var allChunks []models.DocumentChunk
			for _, src := range sources {
				pythonChunks, err := c.vectorClient.GenerateEmbeddings(bgCtx, src.Content)
				if err != nil {
					continue
				}

				for i, pc := range pythonChunks {
					allChunks = append(allChunks, models.DocumentChunk{
						ID:         uuid.NewString(),
						NotebookID: notebookID,
						SourceID:   src.ID,
						ChunkIndex: i,
						Content:    pc.Chunk,
						Embedding:  pc.Embedding,
					})
				}
			}

			if len(allChunks) > 0 {
				_ = c.repo.SaveChunks(notebookID, allChunks)
			}
		}(newSources)
	}
	return newSources
}
