package api

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sourcebook/internal/llm"
	"sourcebook/internal/models"
	"strings"
	"time"
)

func (a *API) HandleNotebookGuide(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	var notebookID string
	for i, p := range parts {
		if p == "notebooks" && i+1 < len(parts) {
			notebookID = parts[i+1]
			break
		}
	}
	if notebookID == "" {
		notebookID = r.URL.Query().Get("notebook_id")
	}
	if notebookID == "" {
		http.Error(w, "notebook_id is required", http.StatusBadRequest)
		return
	}

	refresh := r.URL.Query().Get("refresh") == "true"
	if !refresh {
		if cached, err := a.repo.GetNotebookGuide(notebookID); err == nil && cached != nil && cached.Summary != "" {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(cached)
			return
		}
	}

	sources, err := a.repo.GetSourcesByNotebook(notebookID)
	if err != nil || len(sources) == 0 {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"notebook_id":         notebookID,
			"summary":             "This research notebook currently has no sources ingested. Add documents, web links, or videos to generate an executive briefing.",
			"topics":              []string{},
			"suggested_questions": []string{},
		})
		return
	}

	var sb strings.Builder
	limit := len(sources)
	if limit > 8 {
		limit = 8
	}
	for i := 0; i < limit; i++ {
		src := sources[i]
		snip := src.Snippet
		if snip == "" && len(src.Content) > 0 {
			runes := []rune(src.Content)
			if len(runes) > 180 {
				snip = string(runes[:180]) + "..."
			} else {
				snip = string(runes)
			}
		}
		sb.WriteString(fmt.Sprintf("- Source: %s\n  Excerpt: %s\n", src.Title, snip))
	}

	prompt := fmt.Sprintf(`You are an executive research synthesizer like NotebookLM.
Based on the following source titles and brief excerpts from this notebook, generate:
1. A concise, conversational 2-3 sentence executive summary explaining what this notebook covers. Do NOT use any citations, brackets, or numbers like [1].
2. 3-4 core topics (1-3 words each).
3. 3-4 natural, high-signal suggested questions that a user could ask about these specific materials.

Sources:
%s

Respond ONLY with valid JSON in this exact structure:
{
  "summary": "...",
  "topics": ["Topic A", "Topic B", "Topic C"],
  "suggested_questions": ["Question 1?", "Question 2?", "Question 3?"]
}`, sb.String())

	ctx, cancel := context.WithTimeout(r.Context(), 45*time.Second)
	defer cancel()

	messages := []llm.Message{
		{Role: "system", Content: "You are an intelligent knowledge briefing assistant. Output strictly valid JSON."},
		{Role: "user", Content: prompt},
	}

	guide := models.NotebookGuide{
		NotebookID: notebookID,
	}

	raw, err := a.synthesizer.LLMClient().Generate(ctx, messages)
	if err == nil {
		clean := strings.TrimSpace(raw)
		clean = strings.TrimPrefix(clean, "```json")
		clean = strings.TrimPrefix(clean, "```")
		clean = strings.TrimSuffix(clean, "```")
		clean = strings.TrimSpace(clean)

		var parsed struct {
			Summary            string   `json:"summary"`
			Topics             []string `json:"topics"`
			SuggestedQuestions []string `json:"suggested_questions"`
			Questions          []string `json:"questions"`
			Prompts            []string `json:"prompts"`
		}
		if json.Unmarshal([]byte(clean), &parsed) == nil && parsed.Summary != "" {
			guide.Summary = parsed.Summary
			guide.Topics = parsed.Topics
			if len(parsed.SuggestedQuestions) > 0 {
				guide.SuggestedQuestions = parsed.SuggestedQuestions
			} else if len(parsed.Questions) > 0 {
				guide.SuggestedQuestions = parsed.Questions
			} else if len(parsed.Prompts) > 0 {
				guide.SuggestedQuestions = parsed.Prompts
			}
		}
	}

	if len(guide.SuggestedQuestions) == 0 {
		for _, t := range guide.Topics {
			if len(guide.SuggestedQuestions) < 4 {
				guide.SuggestedQuestions = append(guide.SuggestedQuestions, fmt.Sprintf("What does this research say about %s?", t))
			}
		}
	}

	if guide.Summary == "" {
		guide.Summary = fmt.Sprintf("This notebook synthesizes %d research sources covering %s.", len(sources), sources[0].Title)
		guide.Topics = []string{"Research Synthesis", "Source Analysis"}
		guide.SuggestedQuestions = []string{
			fmt.Sprintf("Summarize the key findings from %s", sources[0].Title),
			"What are the main concepts covered across all sources?",
		}
	}

	_ = a.repo.UpsertNotebookGuide(&guide)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(guide)
	log.Printf("[Notebook Guide] Generated and cached guide for notebook %s", notebookID)
}
