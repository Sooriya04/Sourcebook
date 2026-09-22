package api

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"time"
)

// FetchSingleYouTubeTranscript fetches a transcript via microservice, falling back to local python execution.
func FetchSingleYouTubeTranscript(ctx context.Context, url string) (string, error) {
	youtubeURL := os.Getenv("YOUTUBE_SERVICE_URL")
	if youtubeURL == "" {
		youtubeURL = "http://localhost:6001"
	}

	reqBody, _ := json.Marshal(map[string]interface{}{"url": url})
	endpoint := fmt.Sprintf("%s/youtube/transcript", youtubeURL)
	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBuffer(reqBody))
	if err == nil {
		req.Header.Set("Content-Type", "application/json")
		client := &http.Client{Timeout: 30 * time.Second}
		resp, doErr := client.Do(req)
		if doErr == nil {
			defer resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				var data struct {
					Text string `json:"text"`
				}
				if json.NewDecoder(resp.Body).Decode(&data) == nil && data.Text != "" {
					return data.Text, nil
				}
			}
		}
	}

	// Microservice failed or unreachable — run local python extractor fallback
	return fetchLocalYouTubeTranscript(url)
}

// fetchLocalYouTubeTranscript runs the local python transcript extractor directly as a fallback.
func fetchLocalYouTubeTranscript(url string) (string, error) {
	pythonBin := ".venv/bin/python"
	if _, err := os.Stat(pythonBin); err != nil {
		pythonBin = "python3"
	}

	pyScript := `
import sys, json
sys.path.append("services/youtube")
from services.transcript import TranscriptService
try:
    res = TranscriptService.fetch(sys.argv[1])
    print(json.dumps({"success": True, "text": res["text"]}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`
	ctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, pythonBin, "-c", pyScript, url)
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("local python transcript execution failed: %w", err)
	}

	var data struct {
		Success bool   `json:"success"`
		Text    string `json:"text"`
		Error   string `json:"error"`
	}
	if err := json.Unmarshal(output, &data); err != nil {
		return "", fmt.Errorf("failed to decode local python output: %w", err)
	}

	if !data.Success || data.Text == "" {
		return "", fmt.Errorf("transcript error: %s", data.Error)
	}

	return data.Text, nil
}
