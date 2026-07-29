package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"sourcebook/internal/controller"
	"sourcebook/internal/models"
	"sourcebook/internal/pipeline"
	"sourcebook/internal/providers"
	"strings"
)

type API struct {
	searchController     *controller.UnifiedSearchController
	pipelineSearchSource providers.SearchProvider
	pipelineStore        *pipeline.Store
}

func NewAPI(c *controller.UnifiedSearchController, pipelineSearchSource providers.SearchProvider, pipelineStore *pipeline.Store) *API {
	return &API{
		searchController:     c,
		pipelineSearchSource: pipelineSearchSource,
		pipelineStore:        pipelineStore,
	}
}

func (a *API) HandleSearch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Query   string               `json:"query"`
		Options models.SearchOptions `json:"options"`
	}

	if r.Method == http.MethodPost {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
	} else if r.Method == http.MethodGet {
		req.Query = r.URL.Query().Get("q")
		req.Options.Web = r.URL.Query().Get("web") == "true"
		req.Options.Images = r.URL.Query().Get("images") == "true"
		req.Options.Videos = r.URL.Query().Get("videos") == "true"
		req.Options.News = r.URL.Query().Get("news") == "true"
		req.Options.Language = r.URL.Query().Get("lang")
	}

	if req.Query == "" {
		http.Error(w, "Query is required", http.StatusBadRequest)
		return
	}

	if !req.Options.Web && !req.Options.Images && !req.Options.Videos && !req.Options.News && !req.Options.PDFs && !req.Options.Docs {
		req.Options.Web = true
	}

	results, err := a.searchController.Search(r.Context(), req.Query, req.Options)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if results == nil {
		results = []models.SearchResult{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"query":   req.Query,
		"results": results,
		"count":   len(results),
	})
}

// HandlePipeline: search via SearXNG → top 5 URLs → Searqon /scrape/batch
func (a *API) HandlePipeline(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Query      string `json:"query"`
		MaxSources int    `json:"max_sources,omitempty"`
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

	job := &models.PipelineJob{}
	if a.pipelineStore != nil {
		job = a.pipelineStore.CreateJob(req.Query, maxSources)
		if err := a.pipelineStore.MarkRunning(job.ID); err != nil {
			http.Error(w, fmt.Sprintf("Failed to start job: %v", err), http.StatusInternalServerError)
			return
		}
		w.Header().Set("X-SourceBook-Job-ID", job.ID)
	}

	// Search SearXNG first so the pipeline can operate on normalized URLs.
	options := models.SearchOptions{Web: true}
	var results []models.SearchResult
	var err error
	if a.pipelineSearchSource != nil {
		results, err = a.pipelineSearchSource.Search(r.Context(), req.Query, options)
		if err != nil {
			http.Error(w, fmt.Sprintf("Search error: %v", err), http.StatusInternalServerError)
			return
		}
	} else {
		results, err = a.searchController.Search(r.Context(), req.Query, options)
		if err != nil {
			http.Error(w, fmt.Sprintf("Search error: %v", err), http.StatusInternalServerError)
			return
		}
	}

	// Keep the top unique URLs for downstream scraping.
	var urls []string
	seen := map[string]bool{}
	for _, res := range results {
		if len(urls) >= maxSources {
			break
		}
		if res.URL != "" && !seen[res.URL] {
			seen[res.URL] = true
			urls = append(urls, res.URL)
			if a.pipelineStore != nil {
				a.pipelineStore.UpsertSource(job.ID, res, req.Query)
			}
		}
	}

	if len(urls) == 0 {
		if a.pipelineStore != nil {
			_ = a.pipelineStore.MarkSucceeded(job.ID, []byte(`{"results":[]}`))
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"query":   req.Query,
			"results": []interface{}{},
		})
		return
	}

	// Hand URLs to Searqon for scraping and chunk extraction.
	searqonURL := os.Getenv("SEARQON_SCRAPE_URL")
	if searqonURL == "" {
		searqonURL = "http://127.0.0.1:4001/scrape/batch"
	}

	batchBody, _ := json.Marshal(map[string]interface{}{
		"urls":   urls,
		"format": "markdown",
	})

	searqonReq, err := http.NewRequestWithContext(r.Context(), "POST", searqonURL, bytes.NewBuffer(batchBody))
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to build Searqon request: %v", err), http.StatusInternalServerError)
		return
	}
	searqonReq.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	searqonResp, err := client.Do(searqonReq)
	if err != nil {
		if a.pipelineStore != nil {
			_ = a.pipelineStore.MarkFailed(job.ID, err)
		}
		http.Error(w, fmt.Sprintf("Failed to call Searqon: %v", err), http.StatusInternalServerError)
		return
	}
	defer searqonResp.Body.Close()

	if searqonResp.StatusCode != http.StatusOK {
		respBytes, _ := io.ReadAll(searqonResp.Body)
		if a.pipelineStore != nil {
			_ = a.pipelineStore.MarkFailed(job.ID, fmt.Errorf("searqon returned status %d: %s", searqonResp.StatusCode, string(respBytes)))
		}
		http.Error(w, fmt.Sprintf("Searqon error: %s", string(respBytes)), searqonResp.StatusCode)
		return
	}

	body, err := io.ReadAll(searqonResp.Body)
	if err != nil {
		if a.pipelineStore != nil {
			_ = a.pipelineStore.MarkFailed(job.ID, err)
		}
		http.Error(w, fmt.Sprintf("Failed to read Searqon response: %v", err), http.StatusInternalServerError)
		return
	}

	if a.pipelineStore != nil {
		_ = a.pipelineStore.IndexRawResult(job.ID, body)
		_ = a.pipelineStore.MarkSucceeded(job.ID, body)
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(body)
}

func (a *API) HandleJob(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if a.pipelineStore == nil {
		http.Error(w, "Job store unavailable", http.StatusNotFound)
		return
	}

	jobID := strings.TrimPrefix(r.URL.Path, "/api/sourcebook/v1/jobs/")
	jobID = strings.Trim(jobID, "/")
	if jobID == "" || strings.Contains(jobID, "/") {
		http.Error(w, "Job ID is required", http.StatusBadRequest)
		return
	}

	job, ok := a.pipelineStore.GetJob(jobID)
	if !ok {
		http.Error(w, "Job not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"job":       job,
		"sources":   a.pipelineStore.ListJobSources(jobID),
		"documents": a.pipelineStore.ListJobDocuments(jobID),
		"chunks":    a.pipelineStore.ListJobChunks(jobID),
	})
}
