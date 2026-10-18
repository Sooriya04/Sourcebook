package api

import (
	"encoding/json"
	"net/http"
	"strings"

	"sourcebook/internal/models"
)

// HandleNotebooks routes requests for /notebooks and /notebooks/:id.
func (a *API) HandleNotebooks(w http.ResponseWriter, r *http.Request) {
	// Strip prefix to see if an ID is present
	id := strings.TrimPrefix(r.URL.Path, "/api/sourcebook/v1/notebooks")
	id = strings.TrimPrefix(id, "/")

	if id != "" {
		if strings.HasSuffix(id, "/export") {
			notebookID := strings.TrimSuffix(id, "/export")
			a.handleNotebookExport(w, r, notebookID)
			return
		}
		a.handleNotebookDetail(w, r, id)
		return
	}

	switch r.Method {
	case http.MethodGet:
		a.handleNotebookList(w, r)
	case http.MethodPost:
		a.handleNotebookCreate(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (a *API) handleNotebookList(w http.ResponseWriter, r *http.Request) {
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
}

func (a *API) handleNotebookCreate(w http.ResponseWriter, r *http.Request) {
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
}

func (a *API) handleNotebookDetail(w http.ResponseWriter, r *http.Request, id string) {
	switch r.Method {
	case http.MethodGet:
		a.handleNotebookGet(w, r, id)
	case http.MethodPut:
		a.handleNotebookUpdate(w, r, id)
	case http.MethodDelete:
		a.handleNotebookDelete(w, r, id)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func (a *API) handleNotebookGet(w http.ResponseWriter, r *http.Request, id string) {
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
}

func (a *API) handleNotebookDelete(w http.ResponseWriter, r *http.Request, id string) {
	if err := a.repo.DeleteNotebook(id); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
