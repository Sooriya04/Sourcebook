package api

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"sourcebook/internal/synthesis"
)

// fetchPipelineSources performs Search -> Scrape and returns clean docs.
func (a *API) fetchPipelineSources(ctx context.Context, query string, maxSources int, urls []string, jobID string) ([]synthesis.ScrapedDoc, []byte, error) {
	var youtubeDocs []synthesis.ScrapedDoc

	if len(urls) == 0 {
		var err error
		urls, youtubeDocs, err = a.searchPipelineSources(ctx, query, maxSources, jobID)
		if err != nil {
			return nil, nil, err
		}
	} else {
		log.Printf("[Pipeline] Skipping search, using %d explicitly provided URLs.", len(urls))
	}

	if len(urls) == 0 {
		if len(youtubeDocs) > 0 {
			log.Printf("[Pipeline] No web URLs to scrape, found %d YouTube transcripts.", len(youtubeDocs))
			return youtubeDocs, []byte(`{"success":true,"data":[]}`), nil
		}
		log.Printf("[Pipeline] No valid URLs found to scrape.")
		return []synthesis.ScrapedDoc{}, []byte(`{"success":true,"data":[]}`), nil
	}

	log.Printf("[Pipeline] Extracted %d unique target URLs to process: %v", len(urls), urls)
	docs, rawBody := a.scrapePipelineURLs(ctx, urls)

	if len(youtubeDocs) > 0 {
		docs = append(docs, youtubeDocs...)
	}

	log.Printf("[Pipeline] Pipeline finished successfully. Cleaned %d documents.", len(docs))
	return docs, rawBody, nil
}

func (a *API) scrapePipelineURLs(ctx context.Context, urls []string) ([]synthesis.ScrapedDoc, []byte) {
	cat := categorizeURLs(urls)

	var docs []synthesis.ScrapedDoc
	var body []byte
	var mu sync.Mutex
	var wg sync.WaitGroup

	if len(cat.youtube) > 0 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if yDocs := scrapeYouTubeURLs(ctx, cat.youtube); len(yDocs) > 0 {
				mu.Lock()
				docs = append(docs, yDocs...)
				mu.Unlock()
			}
		}()
	}

	if len(cat.arxiv) > 0 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if aDocs := scrapeArxivURLs(ctx, cat.arxiv); len(aDocs) > 0 {
				mu.Lock()
				docs = append(docs, aDocs...)
				mu.Unlock()
			}
		}()
	}

	if len(cat.reddit) > 0 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if rDocs := scrapeRedditURLs(ctx, cat.reddit); len(rDocs) > 0 {
				mu.Lock()
				docs = append(docs, rDocs...)
				mu.Unlock()
			}
		}()
	}

	if len(cat.social) > 0 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			if sDocs := scrapeSocialURLs(ctx, cat.social); len(sDocs) > 0 {
				mu.Lock()
				docs = append(docs, sDocs...)
				mu.Unlock()
			}
		}()
	}

	if len(cat.web) > 0 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			wDocs, rawBody := a.scrapeWebURLs(ctx, cat.web)
			mu.Lock()
			if len(wDocs) > 0 {
				docs = append(docs, wDocs...)
			}
			body = rawBody
			mu.Unlock()
		}()
	} else {
		body = []byte(`{"success":true,"data":[]}`)
	}

	wg.Wait()
	return docs, body
}

// HandlePipeline: search via SearXNG → top URLs → Searqon /scrape/batch → clean JSON
func (a *API) HandlePipeline(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Query      string   `json:"query"`
		MaxSources int      `json:"max_sources,omitempty"`
		Urls       []string `json:"urls,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Query == "" {
		http.Error(w, "Query is required", http.StatusBadRequest)
		return
	}

	maxSources := req.MaxSources
	if maxSources <= 0 || maxSources > 10 {
		maxSources = 5
	}

	jobID := ""
	if a.pipelineStore != nil {
		job := a.pipelineStore.CreateJob(req.Query, maxSources)
		jobID = job.ID
		_ = a.pipelineStore.MarkRunning(jobID)
		w.Header().Set("X-SourceBook-Job-ID", jobID)
	}

	log.Printf("[Pipeline] Processing query: %q (MaxSources: %d, Provided URLs: %d)", req.Query, maxSources, len(req.Urls))
	docs, rawBody, err := a.fetchPipelineSources(r.Context(), req.Query, maxSources, req.Urls, jobID)
	if err != nil {
		if a.pipelineStore != nil && jobID != "" {
			_ = a.pipelineStore.MarkFailed(jobID, err)
		}
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if a.pipelineStore != nil && jobID != "" {
		_ = a.pipelineStore.IndexRawResult(jobID, rawBody)
		_ = a.pipelineStore.MarkSucceeded(jobID, rawBody)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"data":    docs,
	})
}
