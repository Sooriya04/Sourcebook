package api

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"strconv"

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

	req.Sources = a.enrichSources(r.Context(), id, req.Sources, existingIDs)

	if err := a.repo.SyncNotebookSources(id, req.Sources); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Trigger thread-safe background embedding to prevent HTTP 502 timeouts
	a.triggerNotebookEmbedding(id, req.Sources)

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

func (a *API) enrichSources(ctx context.Context, notebookID string, sources []models.SourceRecord, existingIDs map[string]bool) []models.SourceRecord {
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

	searchServiceURL := os.Getenv("SEARCH_SERVICE_URL")

	var enriched []models.SourceRecord
	for _, src := range sources {
		isNew := src.ID == "" || !existingIDs[src.ID]
		if src.ID == "" {
			src.ID = uuid.NewString()
		}
		enriched = append(enriched, src)

		// Trigger agentic ingestion only if it is a new text source, and satisfies the length threshold
		if isNew && (src.Type == "text" || src.Provider == "text") && len(src.Content) >= threshold && searchServiceURL != "" {
			log.Printf("[AgenticIngestion] New text source detected: %q (len=%d). Triggering planner...", src.Title, len(src.Content))
			plan, err := utils.CallSearchServicePlanner(ctx, src.Content)
			if err != nil {
				log.Printf("[AgenticIngestion] Search planner error: %v", err)
				continue
			}
			if plan == nil || len(plan.Queries) == 0 {
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
					enriched = append(enriched, newSrc)
					log.Printf("[AgenticIngestion] Ingested web source: %q (%s)", doc.Title, doc.URL)
				}
			}
		}
	}
	return enriched
}
