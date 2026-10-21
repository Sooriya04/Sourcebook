package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"sourcebook/internal/llm"
	"strings"
	"time"
)

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

	promptOpts := llm.PodcastOptions{
		Length:      req.Length,
		Format:      req.Format,
		FocusSource: req.FocusSource,
	}
	rawJSON, err := a.synthesizer.GeneratePodcastDialogueWithOptions(r.Context(), docs, promptOpts)
	if err != nil {
		log.Printf("[Podcast] Failed to generate dialogue: %v", err)
		http.Error(w, "Failed to generate podcast dialogue", http.StatusInternalServerError)
		return
	}

	var envelope struct {
		Summary   string        `json:"summary"`
		Takeaways []string      `json:"takeaways"`
		Turns     []PodcastTurn `json:"turns"`
	}
	var turns []PodcastTurn
	var summary string
	var takeaways []string

	if err := json.Unmarshal([]byte(rawJSON), &envelope); err == nil && len(envelope.Turns) > 0 {
		turns = envelope.Turns
		summary = envelope.Summary
		takeaways = envelope.Takeaways
	} else if err := json.Unmarshal([]byte(rawJSON), &turns); err != nil {
		log.Printf("[Podcast] Failed to parse JSON: %v. Raw: %s", err, rawJSON)
		http.Error(w, "Failed to parse dialogue format from LLM", http.StatusInternalServerError)
		return
	}

	a.normalizePodcastTurns(turns, req.VoiceHost1, req.VoiceHost2)

	episodeID := fmt.Sprintf("ep_%d", time.Now().Unix())
	synthPayload, _ := json.Marshal(PodcastSynthesisRequest{
		NotebookID: req.NotebookID,
		Turns:      turns,
		Summary:    summary,
		Takeaways:  takeaways,
		EpisodeID:  episodeID,
		Length:     req.Length,
		Format:     req.Format,
	})

	audioURL := os.Getenv("AUDIO_SERVICE_URL")
	if audioURL == "" {
		audioURL = "http://127.0.0.1:6003"
	}

	client := &http.Client{Timeout: 900 * time.Second}
	reqURL := fmt.Sprintf("%s/synthesize/stream", strings.TrimRight(audioURL, "/"))
	httpReq, err := http.NewRequestWithContext(r.Context(), http.MethodPost, reqURL, bytes.NewBuffer(synthPayload))
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to create request: %v", err), http.StatusInternalServerError)
		return
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(httpReq)
	if err != nil {
		http.Error(w, fmt.Sprintf("Kokoro audio synthesis failed: %v", err), http.StatusBadGateway)
		return
	}
	defer resp.Body.Close()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success":    true,
		"id":         episodeID,
		"notebook_id": req.NotebookID,
		"audio_url":  fmt.Sprintf("/api/sourcebook/v1/study/audio/%s?episode=%s", req.NotebookID, episodeID),
		"summary":    summary,
		"takeaways":  takeaways,
		"turns":      turns,
	})
}

func (a *API) HandleListEpisodes(w http.ResponseWriter, r *http.Request) {
	notebookID := r.URL.Query().Get("notebook_id")
	if notebookID == "" {
		parts := strings.Split(r.URL.Path, "/")
		if len(parts) > 0 {
			notebookID = parts[len(parts)-1]
		}
	}

	audioURL := os.Getenv("AUDIO_SERVICE_URL")
	if audioURL == "" {
		audioURL = "http://127.0.0.1:6003"
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(fmt.Sprintf("%s/episodes/%s", strings.TrimRight(audioURL, "/"), notebookID))
	if err == nil && resp.StatusCode == http.StatusOK {
		defer resp.Body.Close()
		w.Header().Set("Content-Type", "application/json")
		io.Copy(w, resp.Body)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{"episodes": []interface{}{}})
}

func (a *API) HandleListVoices(w http.ResponseWriter, r *http.Request) {
	audioURL := os.Getenv("AUDIO_SERVICE_URL")
	if audioURL == "" {
		audioURL = "http://127.0.0.1:6003"
	}

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(fmt.Sprintf("%s/voices", strings.TrimRight(audioURL, "/")))
	if err == nil && resp.StatusCode == http.StatusOK {
		defer resp.Body.Close()
		w.Header().Set("Content-Type", "application/json")
		io.Copy(w, resp.Body)
		return
	}

	fallback := VoicesResponse{
		Voices: []VoiceProfile{
			{ID: "am_adam", Name: "Adam", Gender: "male", Accent: "American", Style: "Warm & dynamic"},
			{ID: "am_michael", Name: "Michael", Gender: "male", Accent: "American", Style: "Authoritative & clear"},
			{ID: "bm_george", Name: "George", Gender: "male", Accent: "British", Style: "Refined & articulate"},
			{ID: "af_bella", Name: "Bella", Gender: "female", Accent: "American", Style: "Expressive & conversational"},
			{ID: "af_sarah", Name: "Sarah", Gender: "female", Accent: "American", Style: "Thoughtful & measured"},
			{ID: "bf_alice", Name: "Alice", Gender: "female", Accent: "British", Style: "Engaging & witty"},
		},
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(fallback)
}
