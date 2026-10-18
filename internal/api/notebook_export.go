package api

import (
	"fmt"
	"net/http"
	"strings"
)

// handleNotebookExport exports a notebook, its sources, and its notes as a Markdown document.
func (a *API) handleNotebookExport(w http.ResponseWriter, r *http.Request, id string) {
	if strings.TrimSpace(id) == "" {
		http.Error(w, "Notebook ID required", http.StatusBadRequest)
		return
	}

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

	notes, err := a.repo.GetNotesByNotebook(id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	var sb strings.Builder
	sb.WriteString("# Notebook: " + nb.Title + "\n\n")
	if nb.Description != "" {
		sb.WriteString(nb.Description + "\n\n")
	}

	sb.WriteString("## Ingested Sources\n\n")
	if len(sources) == 0 {
		sb.WriteString("*No sources ingested yet.*\n\n")
	} else {
		for i, src := range sources {
			sb.WriteString(fmt.Sprintf("### [%d] %s\n", i+1, src.Title))
			if src.URL != "" {
				sb.WriteString(fmt.Sprintf("- **URL**: %s\n", src.URL))
			}
			sb.WriteString(fmt.Sprintf("- **Type**: %s\n\n", src.Type))
			if src.Content != "" {
				sb.WriteString("#### Content Summary\n\n")
				sb.WriteString(src.Content + "\n\n")
			}
			sb.WriteString("---\n\n")
		}
	}

	sb.WriteString("## Saved Notes & Synthesis Briefs\n\n")
	if len(notes) == 0 {
		sb.WriteString("*No notes added yet.*\n\n")
	} else {
		for i, note := range notes {
			sb.WriteString(fmt.Sprintf("### Note #%d (Created: %s)\n\n", i+1, note.CreatedAt.Format("2006-01-02 15:04:05")))
			sb.WriteString(note.Content + "\n\n")
			sb.WriteString("---\n\n")
		}
	}

	filename := strings.ReplaceAll(nb.Title, " ", "_") + "_export.md"
	w.Header().Set("Content-Type", "text/markdown; charset=utf-8")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%q", filename))
	w.Write([]byte(sb.String()))
}
