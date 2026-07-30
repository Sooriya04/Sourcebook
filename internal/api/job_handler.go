package api

import (
	"encoding/json"
	"net/http"
	"strings"
)

func (a *API) HandleJob(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	if a.pipelineStore == nil {
		http.Error(w, "Job store unavailable", http.StatusNotFound)
		return
	}

	jobID := strings.TrimPrefix(r.URL.Path, "/api/sourcebook/v1/jobs/")
	jobID = strings.Trim(jobID, "/")
	if jobID == "" || strings.Contains(jobID, "/") {
		http.Error(w, "Job ID is required", http.StatusBadRequest)
		return
	}

	job, ok := a.pipelineStore.GetJob(jobID)
	if !ok {
		http.Error(w, "Job not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"job":       job,
		"sources":   a.pipelineStore.ListJobSources(jobID),
		"documents": a.pipelineStore.ListJobDocuments(jobID),
		"chunks":    a.pipelineStore.ListJobChunks(jobID),
	})
}
