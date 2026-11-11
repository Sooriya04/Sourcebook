package api

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"sourcebook/internal/models"
	"sourcebook/internal/utils"

	"github.com/google/uuid"
)

type updateNotebookRequest struct {
	Title       string                `json:"title"`
	Description string                `json:"description"`
	Sources     []models.SourceRecord `json:"sources"`
	Notes       []models.Note         `json:"notes"`
	Messages    []models.ChatMessage  `json:"messages"`
}

func (a *API) handleNotebookUpdate(w http.ResponseWriter, r *http.Request, id string) {
	var req updateNotebookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	title := req.Title
	desc := req.Description
	if title == "" {
		existing, err := a.repo.GetNotebook(id)
		if err == nil && existing != nil {
			title = existing.Title
			if desc == "" {
				desc = existing.Description
			}
		}
	}

	if title != "" {
		if err := a.repo.UpdateNotebook(id, title, desc); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	}

	existingSources, err := a.repo.GetSourcesByNotebook(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	existingIDs := make(map[string]bool)
	for _, src := range existingSources {
		existingIDs[src.ID] = true
	}

	// Ensure all incoming sources have an ID before syncing
	for i := range req.Sources {
		if req.Sources[i].ID == "" {
			req.Sources[i].ID = uuid.NewString()
		}
	}

	if err := a.repo.SyncNotebookSources(id, req.Sources); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Trigger thread-safe background embedding to prevent HTTP 502 timeouts
	a.triggerNotebookEmbedding(id, req.Sources)

	// Offload heavy agentic search / source enrichment to non-blocking background worker
	a.triggerSourceEnrichment(id, req.Sources, existingIDs)

	if err := a.repo.SyncNotebookNotes(id, req.Notes); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if err := a.repo.SyncNotebookMessages(id, req.Messages); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (a *API) triggerSourceEnrichment(notebookID string, sources []models.SourceRecord, existingIDs map[string]bool) {
	if os.Getenv("SEARCH_SERVICE_URL") == "" {
		return
	}
	sourcesCopy := make([]models.SourceRecord, len(sources))
	copy(sourcesCopy, sources)
	existingIDsCopy := make(map[string]bool, len(existingIDs))
	for k, v := range existingIDs {
		existingIDsCopy[k] = v
	}

	go func() {
		bgCtx, cancel := context.WithTimeout(context.Background(), 5*time.Minute)
		defer cancel()
		a.enrichSourcesAsync(bgCtx, notebookID, sourcesCopy, existingIDsCopy)
	}()
}

func (a *API) enrichSourcesAsync(ctx context.Context, notebookID string, sources []models.SourceRecord, existingIDs map[string]bool) {
	maxResults := 2
	if maxStr := os.Getenv("AGENTIC_INGESTION_MAX_RESULTS"); maxStr != "" {
		if parsed, err := strconv.Atoi(maxStr); err == nil && parsed > 0 {
			maxResults = parsed
		}
	}

	threshold := 50
	if threshStr := os.Getenv("AGENTIC_INGESTION_TEXT_THRESHOLD"); threshStr != "" {
		if parsed, err := strconv.Atoi(threshStr); err == nil && parsed > 0 {
			threshold = parsed
		}
	}

	for _, src := range sources {
		isNew := src.ID == "" || !existingIDs[src.ID]
		if !isNew || (src.Type != "text" && src.Provider != "text") || len(src.Content) < threshold {
			continue
		}

		log.Printf("[AgenticIngestion] New text source detected: %q (len=%d). Triggering planner...", src.Title, len(src.Content))
		plan, err := utils.CallSearchServicePlanner(ctx, src.Content)
		if err != nil || plan == nil || len(plan.Queries) == 0 {
			if err != nil {
				log.Printf("[AgenticIngestion] Search planner error: %v", err)
			}
			continue
		}

		log.Printf("[AgenticIngestion] Planner returned %d subqueries", len(plan.Queries))
		for _, pq := range plan.Queries {
			if pq.Query == "" {
				continue
			}
			log.Printf("[AgenticIngestion] Executing search & scrape for subquery: %q", pq.Query)
			docs, _, err := a.fetchPipelineSources(ctx, pq.Query, maxResults, nil, "")
			if err != nil {
				log.Printf("[AgenticIngestion] Search/Scrape failed for %q: %v", pq.Query, err)
				continue
			}
			for _, doc := range docs {
				newSrc := models.SourceRecord{
					ID:           uuid.NewString(),
					NotebookID:   notebookID,
					Title:        doc.Title,
					URL:          doc.URL,
					CanonicalURL: doc.URL,
					Content:      doc.Content,
					Provider:     "web",
					Type:         "web",
				}
				if a.repo != nil {
					if err := a.repo.AddSource(&newSrc); err != nil {
						log.Printf("[AgenticIngestion] Failed to add source %q: %v", newSrc.Title, err)
					} else {
						log.Printf("[AgenticIngestion] Ingested web source: %q (%s)", doc.Title, doc.URL)
					}
				}
			}
		}
	}
}
