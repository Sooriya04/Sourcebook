package arxiv

import (
	"context"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestExtractArxivID(t *testing.T) {
	tests := []struct {
		url      string
		expected string
	}{
		{"https://arxiv.org/abs/2301.07041", "2301.07041"},
		{"https://arxiv.org/pdf/2301.07041.pdf", "2301.07041"},
		{"https://arxiv.org/html/2301.07041v2", "2301.07041v2"},
		{"https://google.com", ""},
	}

	for _, tc := range tests {
		if got := ExtractArxivID(tc.url); got != tc.expected {
			t.Errorf("ExtractArxivID(%q) = %q, want %q", tc.url, got, tc.expected)
		}
	}
}

func TestTryFetchArxivPDF_SizeLimitEnforced(t *testing.T) {
	// Serve a payload that exceeds the configured test size limit
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/pdf")
		// Write 5KB of bytes
		data := make([]byte, 5120)
		for i := range data {
			data[i] = byte('A')
		}
		w.Write(data)
	}))
	defer mockServer.Close()

	origBaseURL := arxivBaseURL
	origMaxSize := maxArxivPDFSize
	defer func() {
		arxivBaseURL = origBaseURL
		maxArxivPDFSize = origMaxSize
	}()

	arxivBaseURL = mockServer.URL
	maxArxivPDFSize = 1024 // 1KB limit for testing

	_, _, err := tryFetchArxivPDF(context.Background(), "test-oversized")
	if err == nil {
		t.Fatal("expected error for oversized PDF download, got nil")
	}

	if !strings.Contains(err.Error(), "exceeded maximum size limit") {
		t.Errorf("expected error to mention 'exceeded maximum size limit', got: %v", err)
	}
}

func TestDefaultMaxArxivPDFSize(t *testing.T) {
	var expectedDefault int64 = 50 * 1024 * 1024
	if maxArxivPDFSize != expectedDefault {
		t.Errorf("expected default maxArxivPDFSize to be %d (50MB), got %d", expectedDefault, maxArxivPDFSize)
	}
}
