package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"sourcebook/internal/utils"

	"github.com/ledongthuc/pdf"
)

// DocumentParseResponse is the unified payload for parsed documents.
type DocumentParseResponse struct {
	Title    string `json:"title"`
	Filename string `json:"filename"`
	Text     string `json:"text"`
	Content  string `json:"content"`
	Type     string `json:"type"`
	URL      string `json:"url,omitempty"`
	Success  bool   `json:"success,omitempty"`
}

func sendDocJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func sendDocError(w http.ResponseWriter, status int, detail string) {
	sendDocJSON(w, status, map[string]string{"detail": detail})
}

func readPdfText(path string) (string, error) {
	f, r, err := pdf.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	var buf bytes.Buffer
	b, err := r.GetPlainText()
	if err != nil {
		return "", err
	}
	if _, err := buf.ReadFrom(b); err != nil {
		return "", err
	}
	return buf.String(), nil
}

// HandleParsePDF parses an uploaded PDF file and returns normalized text.
func (a *API) HandleParsePDF(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err := r.ParseMultipartForm(100 << 20); err != nil {
		sendDocError(w, http.StatusBadRequest, "File too large or invalid multipart form")
		return
	}
	file, handler, err := r.FormFile("file")
	if err != nil {
		sendDocError(w, http.StatusBadRequest, "No file uploaded")
		return
	}
	defer file.Close()

	tempFile, err := os.CreateTemp("", "upload-*.pdf")
	if err != nil {
		sendDocError(w, http.StatusInternalServerError, "Failed to create temp file")
		return
	}
	defer os.Remove(tempFile.Name())

	if _, err := io.Copy(tempFile, file); err != nil {
		_ = tempFile.Close()
		sendDocError(w, http.StatusInternalServerError, "Failed to write temp file")
		return
	}
	_ = tempFile.Close()

	rawText, err := readPdfText(tempFile.Name())
	if err != nil {
		sendDocError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to parse PDF: %v", err))
		return
	}

	cleanedText := utils.CleanText(rawText)
	sendDocJSON(w, http.StatusOK, DocumentParseResponse{
		Title:    strings.TrimSuffix(handler.Filename, filepath.Ext(handler.Filename)),
		Filename: handler.Filename,
		Text:     cleanedText,
		Content:  cleanedText,
		Type:     "pdf",
		Success:  true,
	})
}

// HandleParseMarkdown parses an uploaded markdown or text file and returns normalized text.
func (a *API) HandleParseMarkdown(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var rawText string
	filename := "document.md"
	if err := r.ParseMultipartForm(50 << 20); err == nil && r.MultipartForm != nil {
		if file, handler, formErr := r.FormFile("file"); formErr == nil {
			defer file.Close()
			filename = handler.Filename
			if b, readErr := io.ReadAll(file); readErr == nil {
				rawText = string(b)
			}
		}
	}
	if rawText == "" && r.Body != nil {
		if b, err := io.ReadAll(r.Body); err == nil && len(b) > 0 {
			rawText = string(b)
		}
	}
	if rawText == "" {
		sendDocError(w, http.StatusBadRequest, "No file or text content provided")
		return
	}

	cleanedText := utils.CleanText(rawText)
	sendDocJSON(w, http.StatusOK, DocumentParseResponse{
		Title:    strings.TrimSuffix(filename, filepath.Ext(filename)),
		Filename: filename,
		Text:     cleanedText,
		Content:  cleanedText,
		Type:     "file",
		Success:  true,
	})
}

// HandleParseYouTube extracts the transcript for a given YouTube URL.
func (a *API) HandleParseYouTube(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		URL string `json:"url"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)
	if req.URL == "" {
		req.URL = r.FormValue("url")
	}
	if req.URL == "" {
		sendDocError(w, http.StatusBadRequest, "Valid 'url' parameter is required")
		return
	}

	title := FetchYouTubeTitle(r.Context(), req.URL)
	if title == "" || title == "YouTube Video" {
		title = "YouTube Transcript"
	}

	rawText, err := FetchSingleYouTubeTranscript(r.Context(), req.URL)
	if err != nil {
		sendDocError(w, http.StatusBadGateway, fmt.Sprintf("Failed to extract YouTube transcript: %v", err))
		return
	}

	cleanedText := utils.CleanText(rawText)
	sendDocJSON(w, http.StatusOK, DocumentParseResponse{
		Title:    title,
		Filename: req.URL,
		URL:      req.URL,
		Text:     cleanedText,
		Content:  cleanedText,
		Type:     "youtube",
		Success:  true,
	})
}
