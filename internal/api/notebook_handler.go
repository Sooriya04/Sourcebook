package api

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sourcebook/internal/models"
	"sourcebook/internal/utils"
	"strconv"
	"strings"

	"github.com/google/uuid"
)

func (a *API) HandleNotebooks(w http.ResponseWriter, r *http.Request) {
	// Strip prefix to see if an ID is present
	id := strings.TrimPrefix(r.URL.Path, "/api/sourcebook/v1/notebooks")
	id = strings.TrimPrefix(id, "/")

	if id != "" {
		a.handleNotebookDetail(w, r, id)
		return
	}

	if r.Method == http.MethodGet {
		notebooks, err := a.repo.GetNotebooks()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if notebooks == nil {
			notebooks = []models.Notebook{}
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(notebooks)
		return
	}

	if r.Method == http.MethodPost {
		var req struct {
			Title       string `json:"title"`
			Description string `json:"description"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		nb, err := a.repo.CreateNotebook(req.Title, req.Description)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(nb)
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}

func (a *API) handleNotebookDetail(w http.ResponseWriter, r *http.Request, id string) {
	if r.Method == http.MethodGet {
		nb, err := a.repo.GetNotebook(id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if nb == nil {
			http.Error(w, "Notebook not found", http.StatusNotFound)
			return
		}

		sources, err := a.repo.GetSourcesByNotebook(id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if sources == nil {
			sources = []models.SourceRecord{}
		}

		notes, err := a.repo.GetNotesByNotebook(id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if notes == nil {
			notes = []models.Note{}
		}

		messages, err := a.repo.GetMessagesByNotebook(id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		if messages == nil {
			messages = []models.ChatMessage{}
		}

		payload := map[string]interface{}{
			"id":          nb.ID,
			"title":       nb.Title,
			"description": nb.Description,
			"created_at":  nb.CreatedAt,
			"updated_at":  nb.UpdatedAt,
			"sources":     sources,
			"notes":       notes,
			"messages":    messages,
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(payload)
		return
	}

	if r.Method == http.MethodPut {
		var req struct {
			Title       string                `json:"title"`
			Description string                `json:"description"`
			Sources     []models.SourceRecord `json:"sources"`
			Notes       []models.Note         `json:"notes"`
			Messages    []models.ChatMessage  `json:"messages"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if err := a.repo.UpdateNotebook(id, req.Title, req.Description); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		// Load existing sources to identify new ones
		existingSources, err := a.repo.GetSourcesByNotebook(id)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		existingIDs := make(map[string]bool)
		for _, src := range existingSources {
			existingIDs[src.ID] = true
		}

		// Agentic Ingestion settings from environment variables
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

		var enrichedSources []models.SourceRecord
		for _, src := range req.Sources {
			isNew := src.ID == "" || !existingIDs[src.ID]

			if src.ID == "" {
				src.ID = uuid.NewString()
			}
			enrichedSources = append(enrichedSources, src)

			// Trigger agentic ingestion only if it is a new text source, and satisfies the length threshold
			if isNew && (src.Type == "text" || src.Provider == "text") && len(src.Content) >= threshold && searchServiceURL != "" {
				log.Printf("[AgenticIngestion] New text source detected: %q (len=%d). Triggering agentic search planning...", src.Title, len(src.Content))

				plan, err := utils.CallSearchServicePlanner(r.Context(), src.Content)
				if err != nil {
					log.Printf("[AgenticIngestion] Search planner error: %v", err)
				} else if plan != nil && len(plan.Queries) > 0 {
					log.Printf("[AgenticIngestion] Planner returned %d subqueries.", len(plan.Queries))
					for _, pq := range plan.Queries {
						if pq.Query == "" {
							continue
						}
						log.Printf("[AgenticIngestion] Executing Search & Scrape via Searqon for subquery: %q", pq.Query)
						docs, _, err := a.fetchPipelineSources(r.Context(), pq.Query, maxResults, nil, "")
						if err != nil {
							log.Printf("[AgenticIngestion] Search/Scrape failed for %q: %v", pq.Query, err)
							continue
						}
						for _, doc := range docs {
							newSrc := models.SourceRecord{
								ID:           uuid.NewString(),
								NotebookID:   id,
								Title:        doc.Title,
								URL:          doc.URL,
								CanonicalURL: doc.URL,
								Content:      doc.Content,
								Provider:     "web",
								Type:         "web",
							}
							enrichedSources = append(enrichedSources, newSrc)
							log.Printf("[AgenticIngestion] Successfully ingested web source: %q (%s)", doc.Title, doc.URL)
						}
					}
				}
			}
		}
		req.Sources = enrichedSources

		if err := a.repo.SyncNotebookSources(id, req.Sources); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if err := a.repo.SyncNotebookNotes(id, req.Notes); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if err := a.repo.SyncNotebookMessages(id, req.Messages); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusNoContent)
		return
	}

	if r.Method == http.MethodDelete {
		if err := a.repo.DeleteNotebook(id); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusNoContent)
		return
	}

	http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
}
