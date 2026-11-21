package api

import (
	"bytes"
	"mime/multipart"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHandleParseAudio_MethodNotAllowed(t *testing.T) {
	api := &API{}
	req := httptest.NewRequest(http.MethodGet, "/parse/audio", nil)
	w := httptest.NewRecorder()

	api.HandleParseAudio(w, req)

	if w.Code != http.StatusMethodNotAllowed {
		t.Errorf("expected 405, got %d", w.Code)
	}
}

func TestHandleParseAudio_NoFile(t *testing.T) {
	api := &API{}
	var b bytes.Buffer
	mw := multipart.NewWriter(&b)
	_ = mw.Close()

	req := httptest.NewRequest(http.MethodPost, "/parse/audio", &b)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	w := httptest.NewRecorder()

	api.HandleParseAudio(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for empty form, got %d", w.Code)
	}
}

func TestHandleParseAudio_InvalidExtension(t *testing.T) {
	api := &API{}
	var b bytes.Buffer
	mw := multipart.NewWriter(&b)
	part, _ := mw.CreateFormFile("file", "document.txt")
	_, _ = part.Write([]byte("not audio"))
	_ = mw.Close()

	req := httptest.NewRequest(http.MethodPost, "/parse/audio", &b)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	w := httptest.NewRecorder()

	api.HandleParseAudio(w, req)

	if w.Code != http.StatusBadRequest {
		t.Errorf("expected 400 for unsupported extension, got %d", w.Code)
	}
}

func TestHandleParseAudio_LiveWav(t *testing.T) {
	if findWhisperBinary() == "" {
		t.Skip("whisper binary not found, skipping live transcription test")
	}

	// Create 1-second silent WAV
	var audioBuf bytes.Buffer
	// Standard 44-byte WAV header for 16kHz 16-bit mono PCM (16000 samples = 32000 bytes)
	audioBuf.WriteString("RIFF")
	audioBuf.Write([]byte{0x24, 0x7d, 0x00, 0x00}) // 32036 bytes total
	audioBuf.WriteString("WAVEfmt ")
	audioBuf.Write([]byte{0x10, 0x00, 0x00, 0x00}) // Subchunk1Size = 16
	audioBuf.Write([]byte{0x01, 0x00})             // AudioFormat = 1 (PCM)
	audioBuf.Write([]byte{0x01, 0x00})             // NumChannels = 1
	audioBuf.Write([]byte{0x80, 0x3e, 0x00, 0x00}) // SampleRate = 16000
	audioBuf.Write([]byte{0x00, 0x7d, 0x00, 0x00}) // ByteRate = 32000
	audioBuf.Write([]byte{0x02, 0x00})             // BlockAlign = 2
	audioBuf.Write([]byte{0x10, 0x00})             // BitsPerSample = 16
	audioBuf.WriteString("data")
	audioBuf.Write([]byte{0x00, 0x7d, 0x00, 0x00}) // Subchunk2Size = 32000
	audioBuf.Write(make([]byte, 32000))            // 1s of silence

	var b bytes.Buffer
	mw := multipart.NewWriter(&b)
	part, err := mw.CreateFormFile("file", "lecture_recording.wav")
	if err != nil {
		t.Fatalf("failed to create form file: %v", err)
	}
	_, _ = part.Write(audioBuf.Bytes())
	_ = mw.Close()

	api := &API{}
	req := httptest.NewRequest(http.MethodPost, "/parse/audio", &b)
	req.Header.Set("Content-Type", mw.FormDataContentType())
	w := httptest.NewRecorder()

	api.HandleParseAudio(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected 200 OK from HandleParseAudio, got %d: %s", w.Code, w.Body.String())
	}
}
