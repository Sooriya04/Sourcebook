package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestHandleSourcePing_BlockedTargets(t *testing.T) {
	api := &API{}

	tests := []struct {
		name string
		url  string
	}{
		{"empty url", ""},
		{"invalid scheme file", "file:///etc/passwd"},
		{"invalid scheme gopher", "gopher://127.0.0.1:70/"},
		{"loopback localhost", "http://localhost:8080"},
		{"loopback ipv4 127.0.0.1", "http://127.0.0.1:5000/api"},
		{"loopback ipv4 127.1.2.3", "http://127.1.2.3:80"},
		{"ipv6 loopback", "http://[::1]:8080"},
		{"cloud metadata 169.254.169.254", "http://169.254.169.254/latest/meta-data"},
		{"private 10.0.0.1", "http://10.0.0.1/admin"},
		{"private 172.16.0.1", "http://172.16.0.1:8080"},
		{"private 192.168.1.1", "http://192.168.1.1/"},
		{"unspecified 0.0.0.0", "http://0.0.0.0:5000"},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			body, _ := json.Marshal(map[string]string{"url": tc.url})
			req := httptest.NewRequest(http.MethodPost, "/api/sourcebook/v1/sources/ping", strings.NewReader(string(body)))
			w := httptest.NewRecorder()

			api.HandleSourcePing(w, req)

			if w.Code != http.StatusBadRequest {
				t.Fatalf("expected 400 Bad Request for %q, got status %d (body: %s)", tc.url, w.Code, w.Body.String())
			}
		})
	}
}

func TestHandleSourcePing_AllowedExternal(t *testing.T) {
	api := &API{}

	// Target that fails resolution
	body, _ := json.Marshal(map[string]string{"url": "http://nonexistent-domain-for-testing-12345abcdefg.org"})
	req := httptest.NewRequest(http.MethodPost, "/api/sourcebook/v1/sources/ping", strings.NewReader(string(body)))
	w := httptest.NewRecorder()

	api.HandleSourcePing(w, req)

	// Fails host lookup -> 400 Bad Request
	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 Bad Request for unresolvable host, got %d", w.Code)
	}
}
