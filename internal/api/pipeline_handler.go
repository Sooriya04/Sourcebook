package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sourcebook/internal/models"
	"sourcebook/internal/synthesis"
	"sourcebook/internal/utils"
	"time"
)

// fetchPipelineSources performs Search -> Searqon /scrape/batch and returns clean docs.
func (a *API) fetchPipelineSources(ctx context.Context, query string, maxSources int, urls []string, jobID string) ([]synthesis.ScrapedDoc, []byte, error) {
	if len(urls) == 0 {
		options := models.SearchOptions{Web: true}
		var results []models.SearchResult
		var err error

		log.Printf("[Pipeline] Querying Unified Search (SearXNG) for query: %q", query)
		searchStart := time.Now()

		if a.pipelineSearchSource != nil {
			results, err = a.pipelineSearchSource.Search(ctx, query, options)
		} else {
			results, err = a.searchController.Search(ctx, query, options)
		}

		if err != nil {
			log.Printf("[Pipeline] ❌ Search failed after %v: %v", time.Since(searchStart), err)
			return nil, nil, fmt.Errorf("search failed: %w", err)
		}
		log.Printf("[Pipeline] ✅ Search completed in %v. Found %d raw results.", time.Since(searchStart), len(results))

		seen := map[string]bool{}
		for _, res := range results {
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
	} else {
		log.Printf("[Pipeline] ⚡ Skipping search, using %d explicitly provided URLs.", len(urls))
	}

	if len(urls) == 0 {
		log.Printf("[Pipeline] ⚠️ No valid URLs found to scrape.")
		return []synthesis.ScrapedDoc{}, []byte(`{"success":true,"data":[]}`), nil
	}

	log.Printf("[Pipeline] Extracted %d unique target URLs to scrape: %v", len(urls), urls)

	searqonURL := os.Getenv("SEARQON_SCRAPE_URL")
	if searqonURL == "" {
		searqonURL = "http://127.0.0.1:4001/scrape/batch"
	}

	batchBody, _ := json.Marshal(map[string]interface{}{
		"urls":   urls,
		"format": "markdown",
	})

	searqonReq, err := http.NewRequestWithContext(ctx, "POST", searqonURL, bytes.NewBuffer(batchBody))
	if err != nil {
		return nil, nil, fmt.Errorf("failed to build Searqon request: %w", err)
	}
	searqonReq.Header.Set("Content-Type", "application/json")

	log.Printf("[Pipeline] 🚀 Dispatching batch scrape to Searqon (%s)...", searqonURL)
	scrapeStart := time.Now()

	client := &http.Client{
		Timeout: 45 * time.Second,
	}
	searqonResp, err := client.Do(searqonReq)
	if err != nil {
		log.Printf("[Pipeline] ❌ Searqon request failed after %v: %v", time.Since(scrapeStart), err)
		return nil, nil, fmt.Errorf("failed to call Searqon: %w", err)
	}
	defer searqonResp.Body.Close()

	scrapeDuration := time.Since(scrapeStart)
	log.Printf("[Pipeline] 📥 Searqon responded with status %d in %v", searqonResp.StatusCode, scrapeDuration)

	if searqonResp.StatusCode != http.StatusOK {
		respBytes, _ := io.ReadAll(searqonResp.Body)
		return nil, nil, fmt.Errorf("searqon error %d: %s", searqonResp.StatusCode, string(respBytes))
	}

	body, err := io.ReadAll(searqonResp.Body)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to read Searqon response: %w", err)
	}

	var searqonData struct {
		Success bool `json:"success"`
		Data    []struct {
			Title    string `json:"title"`
			URL      string `json:"url"`
			Markdown string `json:"markdown"`
			Content  string `json:"content"`
		} `json:"data"`
	}

	var docs []synthesis.ScrapedDoc
	if err := json.Unmarshal(body, &searqonData); err == nil && searqonData.Success {
		for _, item := range searqonData.Data {
			text := item.Markdown
			if text == "" {
				text = item.Content
			}
			text = utils.CleanText(text)
			if text != "" {
				docs = append(docs, synthesis.ScrapedDoc{
					Title:   item.Title,
					URL:     item.URL,
					Content: text,
				})
			}
		}
	} else {
		log.Printf("[Pipeline] ⚠️ Searqon returned success=false or invalid JSON")
	}

	log.Printf("[Pipeline] ✨ Pipeline finished successfully. Cleaned and normalized %d documents for LLM.", len(docs))
	return docs, body, nil
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
