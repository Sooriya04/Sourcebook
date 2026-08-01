package api

import (
	"encoding/json"
	"net/http"
	"sourcebook/internal/models"
	"strings"
)

func (a *API) HandleNotebooks(w http.ResponseWriter, r *http.Request) {
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

func (a *API) HandleNotebookDetail(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) < 6 {
		http.Error(w, "Invalid URL", http.StatusBadRequest)
		return
	}
	id := parts[5]

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

		payload := map[string]interface{}{
			"id":          nb.ID,
			"title":       nb.Title,
			"description": nb.Description,
			"created_at":  nb.CreatedAt,
			"updated_at":  nb.UpdatedAt,
			"sources":     sources,
			"notes":       notes,
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
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if err := a.repo.UpdateNotebook(id, req.Title, req.Description); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if err := a.repo.SyncNotebookSources(id, req.Sources); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if err := a.repo.SyncNotebookNotes(id, req.Notes); err != nil {
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
