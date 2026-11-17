package api

import (
	"encoding/json"
	"log"
	"net/http"
)

type QuizQuestion struct {
	ID          int      `json:"id"`
	Question    string   `json:"question"`
	Options     []string `json:"options"`
	AnswerIndex int      `json:"answerIndex"`
	Explanation string   `json:"explanation,omitempty"`
}

type QuizResponse struct {
	Questions []QuizQuestion `json:"questions"`
}

func (a *API) HandleQuiz(w http.ResponseWriter, r *http.Request) {
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

	rawJSON, err := a.synthesizer.GenerateQuiz(r.Context(), docs)
	if err != nil {
		log.Printf("[Study] Failed to generate quiz: %v", err)
		http.Error(w, "Failed to generate quiz", http.StatusInternalServerError)
		return
	}

	cleaned := extractJSON(rawJSON, "[", "]")
	var questions []QuizQuestion
	if err := json.Unmarshal([]byte(cleaned), &questions); err != nil {
		log.Printf("[Study] Failed to parse quiz JSON: %v. Raw: %s", err, rawJSON)
		http.Error(w, "Failed to parse quiz format from LLM", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(QuizResponse{Questions: questions})
}
