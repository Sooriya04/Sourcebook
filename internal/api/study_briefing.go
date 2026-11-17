package api

import (
	"encoding/json"
	"log"
	"net/http"
)

type ConceptItem struct {
	Term       string `json:"term"`
	Definition string `json:"definition"`
}

type BriefingResponse struct {
	Summary   string        `json:"summary"`
	Concepts  []ConceptItem `json:"concepts"`
	Questions []string      `json:"questions"`
}

func (a *API) HandleBriefing(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req StudyRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.NotebookID == "" {
		http.Error(w, "notebook_id is required", http.StatusBadRequest)
		return
	}

	docs, err := a.fetchStudyDocuments(req.NotebookID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	rawJSON, err := a.synthesizer.GenerateBriefing(r.Context(), docs)
	if err != nil {
		log.Printf("[Study] Failed to generate briefing: %v", err)
		http.Error(w, "Failed to generate briefing", http.StatusInternalServerError)
		return
	}

	cleaned := extractJSON(rawJSON, "{", "}")
	var briefing BriefingResponse
	if err := json.Unmarshal([]byte(cleaned), &briefing); err != nil {
		log.Printf("[Study] Failed to parse briefing JSON: %v. Raw: %s", err, rawJSON)
		http.Error(w, "Failed to parse briefing format from LLM", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(briefing)
}
