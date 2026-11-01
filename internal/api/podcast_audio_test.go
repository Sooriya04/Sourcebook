package api

import (
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandleGetPodcastAudio_PathTraversalBlocked(t *testing.T) {
	api := &API{}

	// Test malicious path traversal attempts
	traversalURLs := []string{
		"/api/sourcebook/v1/study/audio/..%2F..%2Fetc%2Fpasswd",
		"/api/sourcebook/v1/study/audio/notebook123?episode=..%2F..%2Fsecret",
		"/api/sourcebook/v1/study/audio/notebook123?episode=../../etc/passwd&meta=true",
		"/api/sourcebook/v1/study/audio/foo%2Fbar",
	}

	for _, u := range traversalURLs {
		req := httptest.NewRequest(http.MethodGet, u, nil)
		w := httptest.NewRecorder()

		api.HandleGetPodcastAudio(w, req)

		if w.Code != http.StatusBadRequest && w.Code != http.StatusNotFound && w.Code != http.StatusForbidden {
			t.Errorf("URL %q allowed with unexpected status %d", u, w.Code)
		}
		if w.Code == http.StatusOK {
			t.Errorf("URL %q bypassed path traversal protection with 200 OK!", u)
		}
	}
}

func TestIsValidID(t *testing.T) {
	valid := []string{"3b415399-b7af-4274-8314-fedc22a56035", "ep_123456", "notebook_1", "ABC-123"}
	for _, id := range valid {
		if !isValidID(id) {
			t.Errorf("Expected valid ID for %q", id)
		}
	}

	invalid := []string{"../etc/passwd", "test/test", "id;rm -rf", "test name", "id\x00null", ""}
	for _, id := range invalid {
		if isValidID(id) {
			t.Errorf("Expected invalid ID for %q", id)
		}
	}
}
