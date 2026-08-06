package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"github.com/ledongthuc/pdf"
)

type ParseResponse struct {
	Title    string `json:"title"`
	Filename string `json:"filename"`
	Text     string `json:"text"`
	Type     string `json:"type"`
}

type ErrorResponse struct {
	Detail string `json:"detail"`
}

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS, PUT, DELETE")
		w.Header().Set("Access-Control-Allow-Headers", "Accept, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
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
	buf.ReadFrom(b)
	
	// Clean up some basic spacing if needed, but the caller will do utils.CleanText anyway
	return buf.String(), nil
}

func handleParsePDF(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	err := r.ParseMultipartForm(100 << 20) // 100 MB max
	if err != nil {
		sendError(w, http.StatusBadRequest, "File too large or invalid multipart form")
		return
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		sendError(w, http.StatusBadRequest, "No file uploaded")
		return
	}
	defer file.Close()

	// Create temp file
	tempFile, err := os.CreateTemp("", "upload-*.pdf")
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to create temp file")
		return
	}
	defer os.Remove(tempFile.Name())

	_, err = io.Copy(tempFile, file)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to write temp file")
		return
	}
	tempFile.Close() // close before reading it with ledongthuc/pdf

	text, err := readPdfText(tempFile.Name())
	if err != nil {
		sendError(w, http.StatusInternalServerError, fmt.Sprintf("Failed to parse PDF: %v", err))
		return
	}

	title := strings.TrimSuffix(handler.Filename, filepath.Ext(handler.Filename))

	resp := ParseResponse{
		Title:    title,
		Filename: handler.Filename,
		Text:     text,
		Type:     "pdf",
	}

	sendJSON(w, http.StatusOK, resp)
}

func handleParseMarkdown(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	err := r.ParseMultipartForm(50 << 20) // 50 MB max
	if err != nil {
		sendError(w, http.StatusBadRequest, "File too large or invalid multipart form")
		return
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		sendError(w, http.StatusBadRequest, "No file uploaded")
		return
	}
	defer file.Close()

	var buf bytes.Buffer
	_, err = io.Copy(&buf, file)
	if err != nil {
		sendError(w, http.StatusInternalServerError, "Failed to read file contents")
		return
	}

	title := strings.TrimSuffix(handler.Filename, filepath.Ext(handler.Filename))

	resp := ParseResponse{
		Title:    title,
		Filename: handler.Filename,
		Text:     buf.String(),
		Type:     "file",
	}

	sendJSON(w, http.StatusOK, resp)
}

func sendJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(payload)
}

func sendError(w http.ResponseWriter, status int, detail string) {
	sendJSON(w, status, ErrorResponse{Detail: detail})
}

func main() {
	mux := http.NewServeMux()

	mux.HandleFunc("/parse/pdf", enableCORS(handleParsePDF))
	mux.HandleFunc("/parse/markdown", enableCORS(handleParseMarkdown))

	port := "4002"
	log.Printf("Starting Document Ingestion Microservice on port %s", port)
	
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
