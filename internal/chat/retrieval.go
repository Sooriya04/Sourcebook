package chat

import (
	"context"
	"log"
	"strings"
	"sync"

	"sourcebook/internal/database"
	"sourcebook/internal/models"
)

type Document struct {
	Title      string
	URL        string
	Content    string
	SourceType string // "Notebook", "Web", "YouTube", "Arxiv"
	Index      int    // Optional custom citation index
}

type Retriever struct {
	repo         *database.Repository
	webRetrieve  func(ctx context.Context, query string, maxSources int) ([]Document, error)
}

func NewRetriever(repo *database.Repository, webRetrieve func(ctx context.Context, query string, maxSources int) ([]Document, error)) *Retriever {
	return &Retriever{
		repo:        repo,
		webRetrieve: webRetrieve,
	}
}

// RetrieveNotebook retrieves relevant chunks from local notebook repository
func (r *Retriever) RetrieveNotebook(ctx context.Context, notebookID string, scopedSourceIDs []string) ([]Document, error) {
	log.Printf("[Chat] Retrieving local notebook sources for %s", notebookID)
	sources, err := r.repo.GetSourcesByNotebook(notebookID)
	if err != nil {
		return nil, err
	}

	if len(scopedSourceIDs) > 0 {
		scopedMap := make(map[string]bool)
		for _, sid := range scopedSourceIDs {
			scopedMap[sid] = true
		}
		var filtered []models.SourceRecord
		for _, src := range sources {
			if scopedMap[src.ID] {
				filtered = append(filtered, src)
			}
		}
		sources = filtered
	}

	sourceMap := make(map[string]models.SourceRecord)
	for _, src := range sources {
		sourceMap[src.ID] = src
	}

	chunks, err := r.repo.GetChunksByNotebook(notebookID)
	if err != nil || len(chunks) == 0 {
		// Fallback to raw source content if chunks aren't available
		var docs []Document
		for _, src := range sources {
			docs = append(docs, Document{
				Title:      src.Title,
				URL:        src.URL,
				Content:    src.Content,
				SourceType: "Notebook",
			})
		}
		return docs, nil
	}

	if len(scopedSourceIDs) > 0 {
		scopedMap := make(map[string]bool)
		for _, sid := range scopedSourceIDs {
			scopedMap[sid] = true
		}
		var filtered []models.DocumentChunk
		for _, chunk := range chunks {
			if scopedMap[chunk.SourceID] {
				filtered = append(filtered, chunk)
			}
		}
		chunks = filtered
	}

	var docs []Document
	for _, c := range chunks {
		title := "Untitled Source"
		url := ""
		if src, ok := sourceMap[c.SourceID]; ok {
			title = src.Title
			url = src.URL
		}
		docs = append(docs, Document{
			Title:      title,
			URL:        url,
			Content:    c.Content,
			SourceType: "Notebook",
		})
	}
	return docs, nil
}

// RetrieveWeb performs search, scraping, and normalization
func (r *Retriever) RetrieveWeb(ctx context.Context, query string, maxSources int) ([]Document, error) {
	if r.webRetrieve == nil {
		return []Document{}, nil
	}
	return r.webRetrieve(ctx, query, maxSources)
}

// RetrieveHybrid concurrently retrieves notebook chunks and queries web search
func (r *Retriever) RetrieveHybrid(ctx context.Context, notebookID string, query string, maxSources int, scopedSourceIDs []string) ([]Document, error) {
	var notebookDocs []Document
	var webDocs []Document
	var wg sync.WaitGroup
	var nbErr, webErr error

	wg.Add(2)
	go func() {
		defer wg.Done()
		notebookDocs, nbErr = r.RetrieveNotebook(ctx, notebookID, scopedSourceIDs)
	}()

	go func() {
		defer wg.Done()
		webDocs, webErr = r.RetrieveWeb(ctx, query, maxSources)
	}()

	wg.Wait()

	if nbErr != nil {
		log.Printf("[Chat] Notebook retrieval failed: %v", nbErr)
	}
	if webErr != nil {
		log.Printf("[Chat] Web retrieval failed: %v", webErr)
	}

	// Merge results
	combined := append(notebookDocs, webDocs...)
	return Deduplicate(combined), nil
}

// Deduplicate removes documents with duplicate URLs or identical titles
func Deduplicate(docs []Document) []Document {
	seenURL := make(map[string]bool)
	seenTitle := make(map[string]bool)
	var deduped []Document

	for _, d := range docs {
		urlKey := strings.ToLower(strings.TrimSpace(d.URL))
		titleKey := strings.ToLower(strings.TrimSpace(d.Title))
		if urlKey != "" && seenURL[urlKey] {
			continue
		}
		if titleKey != "" && seenTitle[titleKey] {
			continue
		}
		if urlKey != "" {
			seenURL[urlKey] = true
		}
		if titleKey != "" {
			seenTitle[titleKey] = true
		}
		deduped = append(deduped, d)
	}
	return deduped
}
