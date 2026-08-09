package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sourcebook/internal/models"
	"sourcebook/internal/synthesis"
	"strings"
)

type FlashcardRequest struct {
	NotebookID string `json:"notebook_id"`
	SourceID   string `json:"source_id,omitempty"`
}

type FlashcardResponse struct {
	Flashcards []map[string]string `json:"flashcards"`
}

func (a *API) HandleFlashcards(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req FlashcardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.NotebookID == "" {
		http.Error(w, "notebook_id is required", http.StatusBadRequest)
		return
	}

	// 1. Fetch chunks from SQLite
	var chunks []models.DocumentChunk
	var err error
	if req.SourceID != "" {
		// (Optional) We can filter by SourceID if the user adds this feature later
		// For now, we will just fetch all chunks for the notebook
		chunks, err = a.repo.GetChunksByNotebook(req.NotebookID)
	} else {
		chunks, err = a.repo.GetChunksByNotebook(req.NotebookID)
	}

	if err != nil {
		http.Error(w, fmt.Sprintf("failed to retrieve chunks: %v", err), http.StatusInternalServerError)
		return
	}

	sources, err := a.repo.GetSourcesByNotebook(req.NotebookID)
	if err != nil {
		http.Error(w, fmt.Sprintf("failed to retrieve sources: %v", err), http.StatusInternalServerError)
		return
	}

	sourceMap := make(map[string]models.SourceRecord)
	for _, src := range sources {
		sourceMap[src.ID] = src
	}

	// Format them for the synthesizer
	var docs []synthesis.ScrapedDoc

	if len(chunks) > 0 {
		chunksBySource := make(map[string][]models.DocumentChunk)
		for _, c := range chunks {
			chunksBySource[c.SourceID] = append(chunksBySource[c.SourceID], c)
		}

		limit := 15
		count := 0
		maxPerSource := 15
		for pass := 0; pass < maxPerSource && count < limit; pass++ {
			for srcID, srcChunks := range chunksBySource {
				if pass < len(srcChunks) {
					c := srcChunks[pass]
					title := "Untitled Source"
					if src, ok := sourceMap[srcID]; ok {
						title = src.Title
					}
					docs = append(docs, synthesis.ScrapedDoc{
						Title:   title,
						Content: c.Content,
					})
					count++
					if count >= limit {
						break
					}
				}
			}
		}
	} else {
		// Fallback to raw source contents if vector chunks are not yet indexed
		for _, src := range sources {
			if strings.TrimSpace(src.Content) != "" {
				docs = append(docs, synthesis.ScrapedDoc{
					Title:   src.Title,
					Content: src.Content,
				})
				if len(docs) >= 5 {
					break
				}
			}
		}
	}

	// 2. Synthesize
	rawJSON, err := a.synthesizer.GenerateFlashcards(r.Context(), docs)
	if err != nil {
		log.Printf("[Study] Failed to generate flashcards: %v", err)
		http.Error(w, "Failed to generate flashcards", http.StatusInternalServerError)
		return
	}

	// Parse JSON
	rawJSON = strings.TrimSpace(rawJSON)
	var flashcards []map[string]string
	if err := json.Unmarshal([]byte(rawJSON), &flashcards); err != nil {
		log.Printf("[Study] Failed to parse flashcard JSON: %v. Raw: %s", err, rawJSON)
		http.Error(w, "Failed to parse flashcard format from LLM", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(FlashcardResponse{
		Flashcards: flashcards,
	})
}
