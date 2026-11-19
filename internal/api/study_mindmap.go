package api

import (
	"encoding/json"
	"log"
	"net/http"
)

// MindMapNode represents a node in the hierarchical concept graph.
type MindMapNode struct {
	ID       string        `json:"id"`
	Label    string        `json:"label"`
	Desc     string        `json:"desc"`
	Children []MindMapNode `json:"children,omitempty"`
}

// MindMapResponse wraps the generated root node.
type MindMapResponse struct {
	Root MindMapNode `json:"root"`
}

// HandleMindMap generates a hierarchical concept graph from notebook sources.
func (a *API) HandleMindMap(w http.ResponseWriter, r *http.Request) {
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

	rawJSON, err := a.synthesizer.GenerateMindMap(r.Context(), docs)
	if err != nil {
		log.Printf("[Study] Failed to generate mind map: %v", err)
		http.Error(w, "Failed to generate mind map", http.StatusInternalServerError)
		return
	}

	cleaned := extractJSON(rawJSON, "{", "}")
	var root MindMapNode
	if err := json.Unmarshal([]byte(cleaned), &root); err != nil {
		log.Printf("[Study] Failed to parse mind map JSON: %v. Raw: %s", err, rawJSON)
		http.Error(w, "Failed to parse mind map format from LLM", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(MindMapResponse{Root: root})
}
