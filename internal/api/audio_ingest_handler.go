package api

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"sourcebook/internal/utils"
)

// findWhisperBinary locates the local whisper CLI executable.
func findWhisperBinary() string {
	if custom := os.Getenv("WHISPER_PATH"); custom != "" {
		if _, err := os.Stat(custom); err == nil {
			return custom
		}
	}
	commonPaths := []string{
		"/usr/local/bin/whisper",
		"/usr/bin/whisper",
	}
	if home, err := os.UserHomeDir(); err == nil && home != "" {
		commonPaths = append([]string{filepath.Join(home, ".local/bin/whisper")}, commonPaths...)
	}
	for _, p := range commonPaths {
		if _, err := os.Stat(p); err == nil {
			return p
		}
	}
	if p, err := exec.LookPath("whisper"); err == nil {
		return p
	}
	return ""
}

// HandleParseAudio transcribes an uploaded audio file (.mp3, .wav, .m4a, .ogg, .flac, .aac, .webm)
// using local Whisper and returns the normalized transcript.
func (a *API) HandleParseAudio(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// 200MB max upload for audio files
	if err := r.ParseMultipartForm(200 << 20); err != nil {
		sendDocError(w, http.StatusBadRequest, "Audio file too large or invalid multipart form")
		return
	}
	if r.MultipartForm != nil {
		defer r.MultipartForm.RemoveAll()
	}

	file, handler, err := r.FormFile("file")
	if err != nil {
		sendDocError(w, http.StatusBadRequest, "No audio file uploaded under form key 'file'")
		return
	}
	defer file.Close()

	ext := strings.ToLower(filepath.Ext(handler.Filename))
	allowedExts := map[string]bool{
		".mp3":  true,
		".wav":  true,
		".m4a":  true,
		".ogg":  true,
		".flac": true,
		".aac":  true,
		".webm": true,
		".wma":  true,
		".opus": true,
	}
	if !allowedExts[ext] {
		sendDocError(w, http.StatusBadRequest, fmt.Sprintf("Unsupported audio format '%s'. Supported: .mp3, .wav, .m4a, .ogg, .flac, .aac, .webm, .opus", ext))
		return
	}

	whisperBin := findWhisperBinary()
	if whisperBin == "" {
		sendDocError(w, http.StatusServiceUnavailable, "Whisper CLI is not installed or available on the host system")
		return
	}

	tempDir, err := os.MkdirTemp("", "audio-transcribe-*")
	if err != nil {
		sendDocError(w, http.StatusInternalServerError, "Failed to create temp directory for audio processing")
		return
	}
	defer os.RemoveAll(tempDir)

	tempAudioPath := filepath.Join(tempDir, "input"+ext)
	destFile, err := os.Create(tempAudioPath)
	if err != nil {
		sendDocError(w, http.StatusInternalServerError, "Failed to create temp audio file")
		return
	}

	if _, err := io.Copy(destFile, file); err != nil {
		_ = destFile.Close()
		sendDocError(w, http.StatusInternalServerError, "Failed to write temp audio file")
		return
	}
	_ = destFile.Close()

	// Transcribe using local Whisper CLI
	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Minute)
	defer cancel()

	modelName := os.Getenv("WHISPER_MODEL")
	if modelName == "" {
		modelName = "base"
	}

	cmd := exec.CommandContext(ctx, whisperBin,
		tempAudioPath,
		"--model", modelName,
		"--output_format", "txt",
		"--output_dir", tempDir,
		"--fp16", "False",
	)

	output, cmdErr := cmd.CombinedOutput()
	if cmdErr != nil {
		sendDocError(w, http.StatusInternalServerError, fmt.Sprintf("Whisper transcription failed: %v. Output: %s", cmdErr, string(output)))
		return
	}

	expectedTxtPath := filepath.Join(tempDir, "input.txt")
	txtBytes, err := os.ReadFile(expectedTxtPath)
	if err != nil {
		sendDocError(w, http.StatusInternalServerError, "Failed to read transcribed audio text output")
		return
	}

	cleanedText := utils.CleanText(string(txtBytes))
	if strings.TrimSpace(cleanedText) == "" {
		cleanedText = "[Audio recording contained no intelligible speech]"
	}

	baseTitle := strings.TrimSuffix(handler.Filename, filepath.Ext(handler.Filename))
	if baseTitle == "" {
		baseTitle = "Audio Recording"
	}

	sendDocJSON(w, http.StatusOK, DocumentParseResponse{
		Title:    baseTitle,
		Filename: handler.Filename,
		Text:     cleanedText,
		Content:  cleanedText,
		Type:     "audio",
		Success:  true,
	})
}
