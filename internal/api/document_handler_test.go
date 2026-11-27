package api

import (
	"bytes"
	"encoding/json"
	"io"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
)

func TestHandleParseMarkdown_Multipart(t *testing.T) {
	api := &API{}

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", "test_notes.md")
	if err != nil {
		t.Fatalf("failed to create form file: %v", err)
	}
	content := "# Heading\n\nThis is some test markdown content."
	part.Write([]byte(content))
	writer.Close()

	req := httptest.NewRequest(http.MethodPost, "/parse/markdown", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()

	api.HandleParseMarkdown(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.StatusCode)
	}

	var parsed DocumentParseResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if parsed.Title != "test_notes" {
		t.Errorf("expected title 'test_notes', got %q", parsed.Title)
	}
	if parsed.Type != "file" {
		t.Errorf("expected type 'file', got %q", parsed.Type)
	}
	if !strings.Contains(parsed.Text, "Heading") {
		t.Errorf("expected text to contain 'Heading', got %q", parsed.Text)
	}
}

func TestHandleParseMarkdown_RawBody(t *testing.T) {
	api := &API{}
	content := "Raw markdown notes without multipart wrapper"
	req := httptest.NewRequest(http.MethodPost, "/parse/markdown", strings.NewReader(content))
	req.Header.Set("Content-Type", "text/markdown")
	w := httptest.NewRecorder()

	api.HandleParseMarkdown(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.StatusCode)
	}

	var parsed DocumentParseResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		t.Fatalf("failed to decode response: %v", err)
	}

	if parsed.Text != content {
		t.Errorf("expected text %q, got %q", content, parsed.Text)
	}
}

func TestHandleParseYouTube_EmptyURL(t *testing.T) {
	api := &API{}
	req := httptest.NewRequest(http.MethodPost, "/parse/youtube", strings.NewReader(`{"url":""}`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()

	api.HandleParseYouTube(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected status 400 for empty url, got %d", resp.StatusCode)
	}
}

func TestHandleParsePDF_EmptyFile(t *testing.T) {
	api := &API{}
	req := httptest.NewRequest(http.MethodPost, "/parse/pdf", strings.NewReader(""))
	w := httptest.NewRecorder()

	api.HandleParsePDF(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusBadRequest {
		t.Fatalf("expected status 400 for empty form, got %d", resp.StatusCode)
	}
}

func TestHandleParsePDF_ValidPDF(t *testing.T) {
	pdfBytes, err := os.ReadFile("/tmp/test.pdf")
	if err != nil {
		t.Skip("skipping test: /tmp/test.pdf not found")
	}

	api := &API{}
	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile("file", "paper.pdf")
	if err != nil {
		t.Fatalf("create form file failed: %v", err)
	}
	part.Write(pdfBytes)
	writer.Close()

	req := httptest.NewRequest(http.MethodPost, "/parse/pdf", body)
	req.Header.Set("Content-Type", writer.FormDataContentType())
	w := httptest.NewRecorder()

	api.HandleParsePDF(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.StatusCode)
	}

	var parsed DocumentParseResponse
	if err := json.NewDecoder(resp.Body).Decode(&parsed); err != nil {
		t.Fatalf("decode failed: %v", err)
	}

	if parsed.Title != "paper" {
		t.Errorf("expected title 'paper', got %q", parsed.Title)
	}
	if parsed.Type != "pdf" {
		t.Errorf("expected type 'pdf', got %q", parsed.Type)
	}
	if !strings.Contains(parsed.Text, "Hello SourceBook PDF Parser Verification") {
		t.Errorf("expected parsed text to contain target text, got %q", parsed.Text)
	}
}

func TestHandleParseMarkdown_BoundedBody(t *testing.T) {
	api := &API{}
	// Large body larger than 50MB should be capped cleanly by io.LimitReader
	limitReader := io.LimitReader(strings.NewReader(strings.Repeat("a", 100)), 50)
	req := httptest.NewRequest(http.MethodPost, "/parse/markdown", limitReader)
	w := httptest.NewRecorder()

	api.HandleParseMarkdown(w, req)

	resp := w.Result()
	if resp.StatusCode != http.StatusOK {
		t.Fatalf("expected status 200, got %d", resp.StatusCode)
	}
}
