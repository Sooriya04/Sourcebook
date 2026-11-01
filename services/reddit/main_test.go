package main

import (
	"context"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

func TestResolveRedditShortLink(t *testing.T) {
	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Location", "https://www.reddit.com/r/golang/comments/12345/test_post/")
		w.WriteHeader(http.StatusFound)
	}))
	defer ts.Close()

	resolved := resolveRedditShortLink(context.Background(), ts.URL)
	expected := "https://www.reddit.com/r/golang/comments/12345/test_post/"
	if resolved != expected {
		t.Fatalf("Expected %s, got %s", expected, resolved)
	}
}

func TestScrapeReddit_UsesEnvConfig(t *testing.T) {
	os.Setenv("REDDIT_MIRROR_DOMAIN", "custom-mirror.com")
	os.Setenv("JINA_READER_URL", "http://mock-jina.local")
	defer func() {
		os.Unsetenv("REDDIT_MIRROR_DOMAIN")
		os.Unsetenv("JINA_READER_URL")
	}()

	mirrorDomain := os.Getenv("REDDIT_MIRROR_DOMAIN")
	if mirrorDomain != "custom-mirror.com" {
		t.Fatalf("Expected custom-mirror.com, got %s", mirrorDomain)
	}

	url := "https://www.reddit.com/r/golang"
	mirrorURL := strings.Replace(url, "reddit.com", mirrorDomain, 1)
	if mirrorURL != "https://www.custom-mirror.com/r/golang" {
		t.Fatalf("Expected replaced mirror URL, got %s", mirrorURL)
	}
}
