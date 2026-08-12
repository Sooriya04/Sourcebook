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
	"strings"
	"sync"
	"sourcebook/internal/arxiv"
	"sourcebook/internal/models"
	"sourcebook/internal/synthesis"
	"sourcebook/internal/utils"
	"time"
)

// fetchPipelineSources performs Search -> Searqon /scrape/batch and returns clean docs.
func (a *API) fetchPipelineSources(ctx context.Context, query string, maxSources int, urls []string, jobID string) ([]synthesis.ScrapedDoc, []byte, error) {
	var youtubeDocs []synthesis.ScrapedDoc

	if len(urls) == 0 {
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
		
		errChan := make(chan error, 2)
		
		log.Printf("[Pipeline] Querying Unified Search (%s) for query: %q", options.Provider, query)
		searchStart := time.Now()

		// Run Web Search
		go func() {
			res, err := a.searchController.Search(ctx, query, options)
			if err == nil {
				results = res
			}
			errChan <- err
		}()
		
		// Run YouTube Search concurrently if enabled
		go func() {
			if settings.YoutubeEnabled && settings.YoutubeMaxSources > 0 {
				log.Printf("[Pipeline] Querying YouTube for query: %q", query)
				docs, err := FetchYouTubeTranscripts(ctx, query, settings.YoutubeMaxSources)
				if err == nil {
					youtubeDocs = docs
				} else {
					log.Printf("[Pipeline] YouTube search failed: %v", err)
				}
			}
			errChan <- nil // Non-fatal if youtube fails
		}()
		
		// Wait for Web Search
		if err := <-errChan; err != nil {
			log.Printf("[Pipeline] Search failed after %v: %v", time.Since(searchStart), err)
			return nil, nil, fmt.Errorf("search failed: %w", err)
		}
		
		// Wait for YouTube Search
		<-errChan

		log.Printf("[Pipeline] Search completed in %v. Found %d raw results and %d youtube results.", time.Since(searchStart), len(results), len(youtubeDocs))

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
		
		// Note: youtubeDocs will be appended to the final docs list after Searqon finishes scraping web URLs
	} else {
		log.Printf("[Pipeline] Skipping search, using %d explicitly provided URLs.", len(urls))
	}

	if len(urls) == 0 {
		log.Printf("[Pipeline] No valid URLs found to scrape.")
		return []synthesis.ScrapedDoc{}, []byte(`{"success":true,"data":[]}`), nil
	}

	log.Printf("[Pipeline] Extracted %d unique target URLs to process: %v", len(urls), urls)

	var webUrls []string
	var youtubeUrls []string
	var arxivUrls []string
	var redditUrls []string
	for _, u := range urls {
		if strings.Contains(u, "youtube.com") || strings.Contains(u, "youtu.be") {
			youtubeUrls = append(youtubeUrls, u)
		} else if arxiv.IsArxivURL(u) {
			arxivUrls = append(arxivUrls, u)
		} else if utils.IsRedditURL(u) {
			redditUrls = append(redditUrls, u)
		} else {
			webUrls = append(webUrls, u)
		}
	}

	var docs []synthesis.ScrapedDoc
	var arxivDocs []synthesis.ScrapedDoc
	var redditDocs []synthesis.ScrapedDoc
	var body []byte
	var mu sync.Mutex
	var wg sync.WaitGroup

	// 1. Process YouTube URLs concurrently
	for _, yu := range youtubeUrls {
		wg.Add(1)
		go func(url string) {
			defer wg.Done()
			log.Printf("[Pipeline] Intercepted YouTube URL for direct transcript extraction: %s", url)
			transcript, ytErr := FetchSingleYouTubeTranscript(ctx, url)
			if ytErr == nil && transcript != "" {
				cleanText := utils.CleanText(transcript)
				if cleanText != "" {
					title := FetchYouTubeTitle(ctx, url)
					mu.Lock()
					youtubeDocs = append(youtubeDocs, synthesis.ScrapedDoc{
						Title:   title,
						URL:     url,
						Content: cleanText,
					})
					mu.Unlock()
				}
			} else {
				log.Printf("[Pipeline] Failed to extract YouTube transcript for %s: %v", url, ytErr)
			}
		}(yu)
	}

	// 2. Process ArXiv URLs concurrently
	for _, au := range arxivUrls {
		wg.Add(1)
		go func(url string) {
			defer wg.Done()
			log.Printf("[Pipeline] Intercepted arXiv URL for paper extraction: %s", url)
			title, content, axErr := arxiv.FetchSingleArxivDocument(ctx, url)
			if axErr == nil && content != "" {
				if title == "" {
					title = "arXiv Paper"
				}
				mu.Lock()
				arxivDocs = append(arxivDocs, synthesis.ScrapedDoc{
					Title:   title,
					URL:     url,
					Content: content,
				})
				mu.Unlock()
			} else {
				log.Printf("[Pipeline] Failed to extract arXiv paper for %s: %v", url, axErr)
			}
		}(au)
	}

	// 2. Process Reddit URLs concurrently via Reddit microservice
	if len(redditUrls) > 0 {
		wg.Add(1)
		go func() {
			defer wg.Done()
			log.Printf("[Pipeline] Intercepted %d Reddit URL(s) for microservice extraction", len(redditUrls))
			res, err := utils.ScrapeWithReddit(ctx, redditUrls)
			if err == nil {
				mu.Lock()
				for _, item := range res {
					if item.Success && item.Markdown != "" {
						cleanText := utils.CleanText(item.Markdown)
						if cleanText != "" {
							redditDocs = append(redditDocs, synthesis.ScrapedDoc{
								Title:   item.Title,
								URL:     item.URL,
								Content: cleanText,
							})
						}
					} else {
						log.Printf("[Pipeline] Reddit scrape failed for %s: %s", item.URL, item.Error)
					}
				}
				mu.Unlock()
			} else {
				log.Printf("[Pipeline] Reddit microservice call failed: %v", err)
			}
		}()
	}

	// 3. Process Web URLs via Searqon concurrently (Batch or Deep Crawl Sub-URLs)
	if len(webUrls) > 0 {
		wg.Add(1)
		go func() {
			defer wg.Done()

			settings, _ := a.repo.GetSettings()
			deepCrawl := settings != nil && settings.DeepCrawlEnabled

			if deepCrawl {
				searqonURL := os.Getenv("SEARQON_URL")
				if searqonURL == "" {
					searqonURL = "http://localhost:4001"
				}
				log.Printf("[Pipeline] Deep Crawl Enabled! Crawling sub-URLs for %d web sources via Searqon (%s)...", len(webUrls), searqonURL)

				limit := 5
				depth := 1
				if settings.DeepCrawlLimit > 0 {
					limit = settings.DeepCrawlLimit
				}
				if settings.DeepCrawlDepth > 0 {
					depth = settings.DeepCrawlDepth
				}

				client := &http.Client{Timeout: 30 * time.Second}
				var crawlWg sync.WaitGroup
				for _, webURL := range webUrls {
					crawlWg.Add(1)
					go func(u string) {
						defer crawlWg.Done()
						crawlEndpoint := fmt.Sprintf("%s/crawl", searqonURL)
						crawlBody, _ := json.Marshal(map[string]interface{}{
							"url":    u,
							"limit":  limit,
							"depth":  depth,
							"format": "markdown",
						})
						req, err := http.NewRequestWithContext(ctx, "POST", crawlEndpoint, bytes.NewBuffer(crawlBody))
						if err != nil {
							return
						}
						req.Header.Set("Content-Type", "application/json")
						resp, err := client.Do(req)
						if err != nil || resp.StatusCode != http.StatusOK {
							if resp != nil {
								resp.Body.Close()
							}
							return
						}
						var searqonCrawlData struct {
							Success bool `json:"success"`
							Data    struct {
								Pages []struct {
									Title    string `json:"title"`
									URL      string `json:"url"`
									Markdown string `json:"markdown"`
									Content  string `json:"content"`
								} `json:"pages"`
							} `json:"data"`
						}
						if err := json.NewDecoder(resp.Body).Decode(&searqonCrawlData); err == nil && searqonCrawlData.Success {
							mu.Lock()
							for _, item := range searqonCrawlData.Data.Pages {
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
							mu.Unlock()
						}
						resp.Body.Close()
					}(webURL)
				}
				crawlWg.Wait()
				return
			}

			// Standard Batch Scrape with Jina fallback
			unresolved := make(map[string]bool, len(webUrls))
			for _, u := range webUrls {
				unresolved[u] = true
			}

			searqonURL := os.Getenv("SEARQON_SCRAPE_URL")
			var searqonSuccess bool
			var respBody []byte

			if searqonURL != "" {
				batchBody, _ := json.Marshal(map[string]interface{}{
					"urls":   webUrls,
					"format": "markdown",
				})
				searqonReq, err := http.NewRequestWithContext(ctx, "POST", searqonURL, bytes.NewBuffer(batchBody))
				if err == nil {
					searqonReq.Header.Set("Content-Type", "application/json")
					client := &http.Client{Timeout: 45 * time.Second}
					searqonResp, err := client.Do(searqonReq)
					if err == nil {
						defer searqonResp.Body.Close()
						if searqonResp.StatusCode == http.StatusOK {
							respBody, err = io.ReadAll(searqonResp.Body)
							if err == nil {
								var searqonData struct {
									Success bool `json:"success"`
									Data    []struct {
										Title    string `json:"title"`
										URL      string `json:"url"`
										Markdown string `json:"markdown"`
										Content  string `json:"content"`
									} `json:"data"`
								}
								if err := json.Unmarshal(respBody, &searqonData); err == nil && searqonData.Success {
									searqonSuccess = true
									mu.Lock()
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
											delete(unresolved, item.URL)
										}
									}
									mu.Unlock()
								}
							}
						}
					}
				}
			}

			// Jina AI fallback for remaining web URLs
			if len(unresolved) > 0 {
				var jinaUrls []string
				for u := range unresolved {
					jinaUrls = append(jinaUrls, u)
				}
				log.Printf("[Pipeline] Searqon did not resolve all web URLs (success=%t). Dispatching Jina AI fallback for %d URL(s)...", searqonSuccess, len(jinaUrls))
				jinaResults, jinaErr := utils.ScrapeWithJina(ctx, jinaUrls)
				if jinaErr == nil {
					mu.Lock()
					for _, item := range jinaResults {
						if item.Success && item.Markdown != "" {
							cleanText := utils.CleanText(item.Markdown)
							if cleanText != "" {
								docs = append(docs, synthesis.ScrapedDoc{
									Title:   item.Title,
									URL:     item.URL,
									Content: cleanText,
								})
								delete(unresolved, item.URL)
							}
						}
					}
					mu.Unlock()
				} else {
					log.Printf("[Pipeline] Fallback Jina AI scrape failed: %v", jinaErr)
				}
			}

			if respBody != nil {
				mu.Lock()
				body = respBody
				mu.Unlock()
			} else {
				mu.Lock()
				body = []byte(`{"success":true,"data":[]}`)
				mu.Unlock()
			}
		}()
	} else {
		body = []byte(`{"success":true,"data":[]}`)
	}
	
	// Wait for all youtube extractions and web scrapes to finish
	wg.Wait()

	// Append youtube, arxiv, and reddit results to docs
	if len(youtubeDocs) > 0 {
		docs = append(docs, youtubeDocs...)
	}
	if len(arxivDocs) > 0 {
		docs = append(docs, arxivDocs...)
	}
	if len(redditDocs) > 0 {
		docs = append(docs, redditDocs...)
	}

	log.Printf("[Pipeline] Pipeline finished successfully. Cleaned and normalized %d documents for LLM.", len(docs))
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
