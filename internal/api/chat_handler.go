package api

import (
	"encoding/json"
	"log"
	"net/http"
)

// HandleChat handles user questions, executes pipeline search & scrape, and synthesizes a grounded response via LLM.
func (a *API) HandleChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Query      string `json:"query"`
		MaxSources int    `json:"max_sources,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Query == "" {
		http.Error(w, "Query parameter 'query' is required", http.StatusBadRequest)
		return
	}

	maxSources := req.MaxSources
	if maxSources <= 0 || maxSources > 10 {
		maxSources = 5
	}

	log.Printf("[Chat] Received query: %q", req.Query)

	docs, _, err := a.fetchPipelineSources(r.Context(), req.Query, maxSources, "")
	if err != nil {
		log.Printf("[Chat] Pipeline fetch error: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	synthesisResp, err := a.synthesizer.Synthesize(r.Context(), req.Query, docs)
	if err != nil {
		log.Printf("[Chat] Synthesis error: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(synthesisResp)
}
