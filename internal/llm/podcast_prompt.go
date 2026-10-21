package llm

import (
	"fmt"
	"strings"
)

// PodcastOptions configures style, length, and focus of audio dialogue.
type PodcastOptions struct {
	Length      string `json:"length,omitempty"`
	Format      string `json:"format,omitempty"`
	FocusSource string `json:"focus_source,omitempty"`
}

// BuildPodcastPromptWithOptions constructs a configured prompt for 2-host dialogue.
func BuildPodcastPromptWithOptions(docs []DocumentContext, opts PodcastOptions) []Message {
	var contextBuilder strings.Builder
	for _, doc := range docs {
		contextBuilder.WriteString(fmt.Sprintf("Source: %s\nContent:\n%s\n\n---\n\n", doc.Title, doc.Content))
	}

	styleDesc := "Two co-hosts, Austin and Taylor, are having an engaging, natural, and insightful discussion exploring the user's workspace notes and documents."
	switch opts.Format {
	case "academic":
		styleDesc = "Two co-hosts, Austin and Taylor, conduct an intellectual, rigorous examination of the findings, evaluating methodologies, key insights, and structured takeaways with scholarly precision."
	case "debate":
		styleDesc = "Two co-hosts, Austin and Taylor, engage in a spirited, balanced debate, actively probing trade-offs, alternative perspectives, and potential limitations of the concepts."
	case "banter":
		styleDesc = "Two co-hosts, Austin and Taylor, have an energetic, entertaining chat filled with witty banter, clear analogies, and relatable takeaways."
	}

	lengthRule := "Generate between 5 to 7 conversational dialogue turns (2-3 spoken sentences each, 30-45 words per turn) synthesizing the notebook."
	switch opts.Length {
	case "short":
		lengthRule = "Generate strictly 3 to 4 concise dialogue turns (1-2 sentences each, 20-30 words per turn) summarizing headline takeaways."
	case "deep":
		lengthRule = "Generate an extensive Deep Dive podcast with 8 to 10 in-depth conversational dialogue turns (3-4 spoken sentences each, 40-55 words per turn) spanning 4 to 5 minutes of speech. Co-hosts should deeply explore core concepts, architectures, practical applications, and trade-offs."
	}

	focusRule := ""
	if strings.TrimSpace(opts.FocusSource) != "" {
		focusRule = fmt.Sprintf("\n6. SPECIAL FOCUS: Give primary emphasis and focus to concepts from: %q.", opts.FocusSource)
	}

	systemPrompt := fmt.Sprintf(`You are an expert audio producer creating a conversational "Deep Dive" podcast overview in the style of Google NotebookLM.
%s

Rules:
1. Format your response strictly as a JSON object containing "summary", "takeaways", and "turns".
2. The co-hosts have distinct personalities:
   - "Austin" (Host 1): Enthusiastic, curious, frames the big picture, asks insightful questions.
   - "Taylor" (Host 2): Analytical, detail-oriented, dives into nuances, examples, and surprising takeaways.
3. Make the dialogue sound natural: use natural transitions, back-and-forth reactions, and clear explanations.
4. Output ONLY valid JSON without any markdown formatting or code blocks:
{
  "summary": "Executive 2-sentence summary capturing the core premise and takeaways of the episode.",
  "takeaways": [
    "First critical insight discovered in the workspace documents.",
    "Second key architectural or conceptual principle.",
    "Third actionable takeaway or practical application."
  ],
  "turns": [
    {"speaker": "austin", "name": "Austin", "text": "Welcome back! Today we are digging into..."},
    {"speaker": "taylor", "name": "Taylor", "text": "Yeah, and what immediately stood out to me was..."}
  ]
}
5. %s%s`, styleDesc, lengthRule, focusRule)

	userPrompt := fmt.Sprintf("Source Materials:\n%s\nGenerate the JSON podcast overview.", contextBuilder.String())

	return []Message{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: userPrompt},
	}
}
