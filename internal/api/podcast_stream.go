package api

import (
	"bufio"
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"sourcebook/internal/llm"
	"strings"
	"time"
)

func (a *API) HandleStreamPodcast(w http.ResponseWriter, r *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	req := a.extractPodcastRequest(r)
	if req.NotebookID == "" {
		http.Error(w, "notebook_id is required", http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")
	flusher.Flush()

	sendSSE := func(eventType, dataJSON string) {
		var compact bytes.Buffer
		if err := json.Compact(&compact, []byte(dataJSON)); err == nil {
			dataJSON = compact.String()
		}
		fmt.Fprintf(w, "event: %s\ndata: %s\n\n", eventType, dataJSON)
		flusher.Flush()
	}

	// Instant cache return unless force regeneration requested
	if req.Force != "true" && r.URL.Query().Get("force") != "true" {
		audioPath := filepath.Join("database", "audio", fmt.Sprintf("%s.wav", req.NotebookID))
		metaPath := filepath.Join("database", "audio", fmt.Sprintf("%s.json", req.NotebookID))
		if _, err := os.Stat(audioPath); err == nil {
			if data, err := os.ReadFile(metaPath); err == nil {
				sendSSE("complete", string(data))
				return
			}
		}
	}

	docs, err := a.gatherNotebookDocs(req.NotebookID)
	if err != nil || len(docs) == 0 {
		sendSSE("error", `{"error": "No sources found in notebook"}`)
		return
	}

	sendSSE("status", `{"step": "drafting", "message": "Drafting 2-host conversational dialogue..."}`)

	promptOpts := llm.PodcastOptions{
		Length:      req.Length,
		Format:      req.Format,
		FocusSource: req.FocusSource,
	}
	rawJSON, err := a.synthesizer.GeneratePodcastDialogueWithOptions(r.Context(), docs, promptOpts)
	if err != nil {
		log.Printf("[PodcastStream] Failed dialogue generation: %v", err)
		sendSSE("error", `{"error": "Failed to generate dialogue"}`)
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
		log.Printf("[PodcastStream] Parse error: %v. Raw: %s", err, rawJSON)
		sendSSE("error", `{"error": "Failed to parse dialogue format"}`)
		return
	}

	a.normalizePodcastTurns(turns, req.VoiceHost1, req.VoiceHost2)

	overviewJSON, _ := json.Marshal(map[string]interface{}{
		"summary":   summary,
		"takeaways": takeaways,
		"turns":     turns,
	})
	sendSSE("overview", string(overviewJSON))

	episodeID := req.EpisodeID
	if episodeID == "" {
		episodeID = fmt.Sprintf("ep_%d", time.Now().Unix())
	}

	a.streamSynthesis(w, r, flusher, req.NotebookID, episodeID, turns, summary, takeaways, req.Length, req.Format)
}

func (a *API) streamSynthesis(w http.ResponseWriter, r *http.Request, flusher http.Flusher, notebookID string, episodeID string, turns []PodcastTurn, summary string, takeaways []string, length string, format string) {
	audioURL := os.Getenv("AUDIO_SERVICE_URL")
	if audioURL == "" {
		audioURL = "http://127.0.0.1:6003"
	}

	synthPayload, _ := json.Marshal(PodcastSynthesisRequest{
		NotebookID: notebookID,
		Turns:      turns,
		Summary:    summary,
		Takeaways:  takeaways,
		EpisodeID:  episodeID,
		Length:     length,
		Format:     format,
	})

	client := &http.Client{Timeout: 900 * time.Second}
	reqURL := fmt.Sprintf("%s/synthesize/stream", strings.TrimRight(audioURL, "/"))
	httpReq, err := http.NewRequestWithContext(r.Context(), http.MethodPost, reqURL, bytes.NewBuffer(synthPayload))
	if err != nil {
		fmt.Fprintf(w, "event: error\ndata: {\"error\": \"Failed to connect to audio service\"}\n\n")
		flusher.Flush()
		return
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := client.Do(httpReq)
	if err != nil {
		fmt.Fprintf(w, "event: error\ndata: {\"error\": \"Audio synthesis failed\"}\n\n")
		flusher.Flush()
		return
	}
	defer resp.Body.Close()

	scanner := bufio.NewScanner(resp.Body)
	for scanner.Scan() {
		line := scanner.Text()
		if strings.HasPrefix(line, "data:") {
			fmt.Fprintf(w, "event: progress\n%s\n\n", line)
			flusher.Flush()
		}
	}
}

func (a *API) extractPodcastRequest(r *http.Request) PodcastGenerateRequest {
	var req PodcastGenerateRequest
	if r.Method == http.MethodPost && r.Body != nil {
		json.NewDecoder(r.Body).Decode(&req)
	}
	if req.NotebookID == "" {
		q := r.URL.Query()
		req.NotebookID = q.Get("notebook_id")
		req.Length = q.Get("length")
		req.Format = q.Get("format")
		req.FocusSource = q.Get("focus_source")
		req.VoiceHost1 = q.Get("voice_host1")
		req.VoiceHost2 = q.Get("voice_host2")
		req.Force = q.Get("force")
	}
	if req.Force == "" {
		req.Force = r.URL.Query().Get("force")
	}
	return req
}
