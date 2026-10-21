package api

import (
	"sourcebook/internal/synthesis"
	"strings"
)

// PodcastGenerateRequest contains payload options for generating audio overviews.
type PodcastGenerateRequest struct {
	NotebookID  string `json:"notebook_id"`
	Length      string `json:"length,omitempty"`       // "short", "standard", "deep"
	Format      string `json:"format,omitempty"`       // "banter", "academic", "debate"
	FocusSource string `json:"focus_source,omitempty"` // Title or topic
	VoiceHost1  string `json:"voice_host1,omitempty"`  // Austin voice ID
	VoiceHost2  string `json:"voice_host2,omitempty"`  // Taylor voice ID
	Force       string `json:"force,omitempty"`        // "true" to force regeneration
	EpisodeID   string `json:"episode_id,omitempty"`
}

// PodcastTurn represents an individual spoken line with timestamps.
type PodcastTurn struct {
	Speaker   string  `json:"speaker"`
	Name      string  `json:"name"`
	Text      string  `json:"text"`
	Voice     string  `json:"voice,omitempty"`
	StartTime float64 `json:"start_time,omitempty"`
	EndTime   float64 `json:"end_time,omitempty"`
	Duration  float64 `json:"duration,omitempty"`
}

// PodcastSynthesisRequest is dispatched to the Python Kokoro TTS service.
type PodcastSynthesisRequest struct {
	NotebookID string        `json:"notebook_id"`
	Turns      []PodcastTurn `json:"turns"`
	Speed      float64       `json:"speed,omitempty"`
	Summary    string        `json:"summary,omitempty"`
	Takeaways  []string      `json:"takeaways,omitempty"`
	EpisodeID  string        `json:"episode_id,omitempty"`
	Length     string        `json:"length,omitempty"`
	Format     string        `json:"format,omitempty"`
}

// PodcastResponse returns final synthesized overview details.
type PodcastResponse struct {
	Success    bool          `json:"success"`
	ID         string        `json:"id,omitempty"`
	NotebookID string        `json:"notebook_id"`
	AudioURL   string        `json:"audio_url"`
	Duration   float64       `json:"duration"`
	Summary    string        `json:"summary,omitempty"`
	Takeaways  []string      `json:"takeaways,omitempty"`
	Turns      []PodcastTurn `json:"turns"`
}

// PodcastEpisode represents an episode in the notebook audio playlist.
type PodcastEpisode struct {
	ID         string        `json:"id"`
	NotebookID string        `json:"notebook_id"`
	CreatedAt  string        `json:"created_at,omitempty"`
	Duration   float64       `json:"duration"`
	Format     string        `json:"format,omitempty"`
	Length     string        `json:"length,omitempty"`
	Summary    string        `json:"summary,omitempty"`
	Takeaways  []string      `json:"takeaways,omitempty"`
	AudioURL   string        `json:"audio_url"`
	Turns      []PodcastTurn `json:"turns,omitempty"`
}

// EpisodesResponse wraps descending episode history.
type EpisodesResponse struct {
	Episodes []PodcastEpisode `json:"episodes"`
}

// VoiceProfile defines voice characteristics for UI selectors.
type VoiceProfile struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Gender string `json:"gender"`
	Accent string `json:"accent"`
	Style  string `json:"style"`
}

// VoicesResponse holds available Kokoro voice options.
type VoicesResponse struct {
	Voices []VoiceProfile `json:"voices"`
}

func (a *API) normalizePodcastTurns(turns []PodcastTurn, host1Voice, host2Voice string) {
	for i := range turns {
		spk := strings.ToLower(strings.TrimSpace(turns[i].Speaker))
		isHost2 := strings.Contains(spk, "taylor") || strings.Contains(spk, "host2") || strings.Contains(spk, "host 2") || strings.Contains(spk, "2")
		if isHost2 {
			turns[i].Speaker = "taylor"
			turns[i].Name = "Taylor"
			if host2Voice != "" {
				turns[i].Voice = host2Voice
			} else {
				turns[i].Voice = "af_bella"
			}
		} else {
			turns[i].Speaker = "austin"
			turns[i].Name = "Austin"
			if host1Voice != "" {
				turns[i].Voice = host1Voice
			} else {
				turns[i].Voice = "am_adam"
			}
		}
	}
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
