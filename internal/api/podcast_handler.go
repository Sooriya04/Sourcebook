package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sourcebook/internal/synthesis"
	"strings"
	"time"
)

type PodcastGenerateRequest struct {
	NotebookID string `json:"notebook_id"`
}

type PodcastTurn struct {
	Speaker   string  `json:"speaker"`
	Name      string  `json:"name"`
	Text      string  `json:"text"`
	Voice     string  `json:"voice,omitempty"`
	StartTime float64 `json:"start_time,omitempty"`
	EndTime   float64 `json:"end_time,omitempty"`
	Duration  float64 `json:"duration,omitempty"`
}

type PodcastSynthesisRequest struct {
	NotebookID string        `json:"notebook_id"`
	Turns      []PodcastTurn `json:"turns"`
}

type PodcastResponse struct {
	Success    bool          `json:"success"`
	NotebookID string        `json:"notebook_id"`
	AudioURL   string        `json:"audio_url"`
	Duration   float64       `json:"duration"`
	Turns      []PodcastTurn `json:"turns"`
}

func (a *API) HandleGeneratePodcast(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req PodcastGenerateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.NotebookID == "" {
		http.Error(w, "notebook_id is required", http.StatusBadRequest)
		return
	}

	docs, err := a.gatherNotebookDocs(req.NotebookID)
	if err != nil || len(docs) == 0 {
		http.Error(w, "No sources found in notebook to generate overview", http.StatusBadRequest)
		return
	}

	rawJSON, err := a.synthesizer.GeneratePodcastDialogue(r.Context(), docs)
	if err != nil {
		log.Printf("[Podcast] Failed to generate dialogue: %v", err)
		http.Error(w, "Failed to generate podcast dialogue", http.StatusInternalServerError)
		return
	}

	var turns []PodcastTurn
	if err := json.Unmarshal([]byte(rawJSON), &turns); err != nil {
		log.Printf("[Podcast] Failed to parse JSON: %v. Raw: %s", err, rawJSON)
		http.Error(w, "Failed to parse dialogue format from LLM", http.StatusInternalServerError)
		return
	}

	synthPayload, _ := json.Marshal(PodcastSynthesisRequest{
		NotebookID: req.NotebookID,
		Turns:      turns,
	})

	audioURL := os.Getenv("AUDIO_SERVICE_URL")
	if audioURL == "" {
		audioURL = "http://127.0.0.1:6003"
	}

	client := &http.Client{Timeout: 90 * time.Second}
	resp, err := client.Post(audioURL+"/synthesize", "application/json", bytes.NewBuffer(synthPayload))
	if err != nil {
		log.Printf("[Podcast] Kokoro TTS synthesis service failed: %v", err)
		http.Error(w, fmt.Sprintf("Kokoro audio synthesis failed: %v", err), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		log.Printf("[Podcast] Synthesis service error %d: %s", resp.StatusCode, string(body))
		http.Error(w, "Audio synthesis failed", http.StatusBadGateway)
		return
	}

	var synthResp PodcastResponse
	if err := json.NewDecoder(resp.Body).Decode(&synthResp); err != nil {
		http.Error(w, "Failed to parse synthesis response", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(synthResp)
}

func (a *API) HandleGetPodcastAudio(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(r.URL.Path, "/")
	if len(parts) == 0 {
		http.NotFound(w, r)
		return
	}
	notebookID := parts[len(parts)-1]
	notebookID = strings.TrimSuffix(notebookID, ".wav")

	audioPath := filepath.Join("database", "audio", fmt.Sprintf("%s.wav", notebookID))
	if _, err := os.Stat(audioPath); os.IsNotExist(err) {
		http.NotFound(w, r)
		return
	}

	w.Header().Set("Content-Type", "audio/wav")
	http.ServeFile(w, r, audioPath)
}

func (a *API) gatherNotebookDocs(notebookID string) ([]synthesis.ScrapedDoc, error) {
	sources, err := a.repo.GetSourcesByNotebook(notebookID)
	if err != nil {
		return nil, err
	}

	var docs []synthesis.ScrapedDoc
	for _, src := range sources {
		if strings.TrimSpace(src.Content) != "" {
			docs = append(docs, synthesis.ScrapedDoc{
				Title:   src.Title,
				Content: src.Content,
			})
			if len(docs) >= 8 {
				break
			}
		}
	}
	return docs, nil
}
