package api

import (
	"encoding/json"
	"net/http"

	"sourcebook/internal/models"
)

func (a *API) HandleSearch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost && r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Query   string               `json:"query"`
		Options models.SearchOptions `json:"options"`
	}

	if r.Method == http.MethodPost {
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
	} else if r.Method == http.MethodGet {
		req.Query = r.URL.Query().Get("q")
		req.Options.Web = r.URL.Query().Get("web") == "true"
		req.Options.Images = r.URL.Query().Get("images") == "true"
		req.Options.Videos = r.URL.Query().Get("videos") == "true"
		req.Options.News = r.URL.Query().Get("news") == "true"
		req.Options.Language = r.URL.Query().Get("lang")
	}

	if req.Query == "" {
		http.Error(w, "Query is required", http.StatusBadRequest)
		return
	}

	settings, err := a.repo.GetSettings()
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	req.Options.Provider = settings.SearchProvider
	if req.Options.MaxResults == 0 {
		req.Options.MaxResults = settings.MaxSources
	}
	req.Options.SearxngLimit = settings.SearxngSplit
	req.Options.DdgLimit = settings.DdgSplit

	if !req.Options.Web && !req.Options.Images && !req.Options.Videos && !req.Options.News && !req.Options.PDFs && !req.Options.Docs {
		req.Options.Web = true
	}

	results, err := a.searchController.Search(r.Context(), req.Query, req.Options)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	if results == nil {
		results = []models.SearchResult{}
	}

	// Opportunistically trigger one background scrape repair cycle.
	// Non-blocking — does not delay the search response.
	go a.sentinel.Trigger()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"query":   req.Query,
		"results": results,
		"count":   len(results),
	})
}
