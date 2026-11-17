package api

import (
	"encoding/json"
	"log"
	"net/http"
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
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.NotebookID == "" {
		http.Error(w, "notebook_id is required", http.StatusBadRequest)
		return
	}

	docs, err := a.fetchStudyDocuments(req.NotebookID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rawJSON, err := a.synthesizer.GenerateFlashcards(r.Context(), docs)
	if err != nil {
		log.Printf("[Study] Failed to generate flashcards: %v", err)
		http.Error(w, "Failed to generate flashcards", http.StatusInternalServerError)
		return
	}

	cleaned := extractJSON(rawJSON, "[", "]")
	var flashcards []map[string]string
	if err := json.Unmarshal([]byte(cleaned), &flashcards); err != nil {
		log.Printf("[Study] Failed to parse flashcard JSON: %v. Raw: %s", err, rawJSON)
		http.Error(w, "Failed to parse flashcard format from LLM", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(FlashcardResponse{
		Flashcards: flashcards,
	})
}
