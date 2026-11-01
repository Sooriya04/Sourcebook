package api

import (
	"context"
	"fmt"
	"log"
	"sync"
	"time"

	"sourcebook/internal/models"
	"sourcebook/internal/synthesis"
)

func (a *API) searchPipelineSources(ctx context.Context, query string, maxSources int, jobID string) ([]string, []synthesis.ScrapedDoc, error) {
	settings, err := a.repo.GetSettings()
	if err != nil {
		log.Printf("[Pipeline] Failed to fetch settings: %v", err)
		return nil, nil, fmt.Errorf("failed to fetch settings: %w", err)
	}

	options := models.SearchOptions{
		Web:          true,
		Provider:     settings.SearchProvider,
		MaxResults:   settings.MaxSources,
		SearxngLimit: settings.SearxngSplit,
		DdgLimit:     settings.DdgSplit,
	}

	var results []models.SearchResult
	var youtubeDocs []synthesis.ScrapedDoc
	var mu sync.Mutex

	webErrChan := make(chan error, 1)
	ytDone := make(chan struct{})

	log.Printf("[Pipeline] Querying Unified Search (%s) for query: %q", options.Provider, query)
	searchStart := time.Now()

	// Run Web Search
	go func() {
		res, err := a.searchController.Search(ctx, query, options)
		if err == nil {
			mu.Lock()
			results = res
			mu.Unlock()
		}
		webErrChan <- err
	}()

	// Run YouTube Search concurrently if enabled
	go func() {
		defer close(ytDone)
		if settings.YoutubeEnabled && settings.YoutubeMaxSources > 0 {
			log.Printf("[Pipeline] Querying YouTube for query: %q", query)
			docs, err := FetchYouTubeTranscripts(ctx, query, settings.YoutubeMaxSources)
			if err == nil && len(docs) > 0 {
				mu.Lock()
				youtubeDocs = docs
				mu.Unlock()
			} else if err != nil {
				log.Printf("[Pipeline] YouTube search failed: %v", err)
			}
		}
	}()

	// Wait for Web Search explicitly
	if err := <-webErrChan; err != nil {
		log.Printf("[Pipeline] Search failed after %v: %v", time.Since(searchStart), err)
		return nil, nil, fmt.Errorf("search failed: %w", err)
	}

	// Wait for YouTube Search to complete
	<-ytDone

	mu.Lock()
	resultsCopy := make([]models.SearchResult, len(results))
	copy(resultsCopy, results)
	mu.Unlock()

	log.Printf("[Pipeline] Search completed in %v. Found %d raw results.", time.Since(searchStart), len(resultsCopy))

	var urls []string
	seen := map[string]bool{}
	for _, res := range resultsCopy {
		if len(urls) >= maxSources {
			break
		}
		if res.URL != "" && !seen[res.URL] {
			seen[res.URL] = true
			urls = append(urls, res.URL)
			if a.pipelineStore != nil && jobID != "" {
				a.pipelineStore.UpsertSource(jobID, res, query)
			}
		}
	}

	return urls, youtubeDocs, nil
}
