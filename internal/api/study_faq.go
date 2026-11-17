package api

import (
	"encoding/json"
	"log"
	"net/http"
)

type FAQItem struct {
	Q string `json:"q"`
	A string `json:"a"`
}

type FAQResponse struct {
	FAQ []FAQItem `json:"faq"`
}

func (a *API) HandleFAQ(w http.ResponseWriter, r *http.Request) {
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

	rawJSON, err := a.synthesizer.GenerateFAQ(r.Context(), docs)
	if err != nil {
		log.Printf("[Study] Failed to generate FAQ: %v", err)
		http.Error(w, "Failed to generate FAQ", http.StatusInternalServerError)
		return
	}

	cleaned := extractJSON(rawJSON, "[", "]")
	var faq []FAQItem
	if err := json.Unmarshal([]byte(cleaned), &faq); err != nil {
		log.Printf("[Study] Failed to parse FAQ JSON: %v. Raw: %s", err, rawJSON)
		http.Error(w, "Failed to parse FAQ format from LLM", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(FAQResponse{FAQ: faq})
}
