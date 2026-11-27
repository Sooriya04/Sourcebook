package api

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandleDeleteEpisode_PathTraversalBlocked(t *testing.T) {
	api := &API{}

	traversalCases := []struct {
		name       string
		notebookID string
		episodeID  string
	}{
		{"dot-dot in notebook_id", "../../etc", "valid_ep"},
		{"dot-dot in episode_id", "valid_nb", "../../etc/passwd"},
		{"slash in notebook_id", "foo/bar", "valid_ep"},
		{"slash in episode_id", "valid_nb", "foo/bar"},
		{"empty notebook_id", "", "valid_ep"},
		{"empty episode_id", "valid_nb", ""},
		{"encoded traversal in notebook_id", "..%2F..%2Fetc", "valid_ep"},
		{"encoded traversal in episode_id", "valid_nb", "..%2F..%2Fsecret"},
	}

	for _, tc := range traversalCases {
		t.Run(tc.name, func(t *testing.T) {
			url := "/api/sourcebook/v1/study/podcast/episodes?notebook_id=" + tc.notebookID + "&episode_id=" + tc.episodeID
			req := httptest.NewRequest(http.MethodDelete, url, nil)
			w := httptest.NewRecorder()

			api.HandleListEpisodes(w, req)

			if w.Code != http.StatusBadRequest {
				t.Errorf("expected 400 Bad Request for %s, got %d", tc.name, w.Code)
			}
		})
	}
}

func TestHandleRenameEpisode_PathTraversalBlocked(t *testing.T) {
	api := &API{}

	traversalCases := []struct {
		name       string
		notebookID string
		episodeID  string
	}{
		{"traversal in notebook_id", "../../etc", "ep1"},
		{"traversal in episode_id", "nb1", "../../etc/passwd"},
		{"slash in notebook_id", "dir/sub", "ep1"},
		{"slash in episode_id", "nb1", "ep/sub"},
		{"empty notebook_id", "", "ep1"},
		{"empty episode_id", "nb1", ""},
		{"encoded traversal in notebook_id", "..%2F..%2Fetc", "ep1"},
		{"encoded traversal in episode_id", "nb1", "..%2F..%2Fsecret"},
	}

	for _, tc := range traversalCases {
		t.Run(tc.name, func(t *testing.T) {
			payload := map[string]string{
				"notebook_id": tc.notebookID,
				"episode_id":  tc.episodeID,
				"title":       "New Episode Title",
			}
			body, _ := json.Marshal(payload)
			req := httptest.NewRequest(http.MethodPut, "/api/sourcebook/v1/study/podcast/episodes", bytes.NewReader(body))
			w := httptest.NewRecorder()

			api.HandleListEpisodes(w, req)

			if w.Code != http.StatusBadRequest {
				t.Errorf("expected 400 Bad Request for %s, got %d", tc.name, w.Code)
			}
		})
	}
}

func TestHandleEpisodeDeleteAndRename_ValidIDs(t *testing.T) {
	api := &API{}

	// Test valid delete request
	delReq := httptest.NewRequest(http.MethodDelete, "/api/sourcebook/v1/study/podcast/episodes?notebook_id=valid_nb&episode_id=valid_ep", nil)
	delW := httptest.NewRecorder()
	api.HandleListEpisodes(delW, delReq)
	if delW.Code != http.StatusOK {
		t.Errorf("expected 200 OK for valid delete, got %d", delW.Code)
	}

	// Test valid rename request
	payload := map[string]string{
		"notebook_id": "valid_nb",
		"episode_id":  "valid_ep",
		"title":       "Updated Title",
	}
	body, _ := json.Marshal(payload)
	renameReq := httptest.NewRequest(http.MethodPut, "/api/sourcebook/v1/study/podcast/episodes", bytes.NewReader(body))
	renameW := httptest.NewRecorder()
	api.HandleListEpisodes(renameW, renameReq)
	if renameW.Code != http.StatusOK {
		t.Errorf("expected 200 OK for valid rename, got %d", renameW.Code)
	}
}

func TestHandleListEpisodes_PathTraversalBlocked(t *testing.T) {
	api := &API{}

	traversalCases := []struct {
		name       string
		notebookID string
	}{
		{"dot-dot traversal", "../../etc"},
		{"slash in notebook_id", "foo/bar"},
		{"empty notebook_id", ""},
		{"encoded traversal", "..%2F..%2Fetc"},
	}

	for _, tc := range traversalCases {
		t.Run(tc.name, func(t *testing.T) {
			url := "/api/sourcebook/v1/study/podcast/episodes?notebook_id=" + tc.notebookID
			req := httptest.NewRequest(http.MethodGet, url, nil)
			w := httptest.NewRecorder()

			api.HandleListEpisodes(w, req)

			if w.Code != http.StatusBadRequest {
				t.Errorf("expected 400 Bad Request for %s, got %d", tc.name, w.Code)
			}
		})
	}
}
