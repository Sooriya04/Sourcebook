package llm

import (
	"fmt"
	"sourcebook/internal/models"
	"strings"
)

// BuildYouTubeChatPrompt structures timestamp-grounded system and context messages.
func BuildYouTubeChatPrompt(videoTitle string, segments []models.YouTubeSegment, history []Message, query string) []Message {
	var sb strings.Builder

	sb.WriteString(fmt.Sprintf("You are an expert video research assistant analyzing the YouTube video: \"%s\".\n\n", videoTitle))
	sb.WriteString("CRITICAL GROUNDING INSTRUCTIONS:\n")
	sb.WriteString("1. You must answer the user's question strictly using the provided timestamped transcript.\n")
	sb.WriteString("2. Whenever stating a fact, quote, explanation, or key finding, YOU MUST CITE THE EXACT TIMESTAMP in brackets like [03:15] or [14:22].\n")
	sb.WriteString("3. Only cite timestamps that actually appear in the transcript below. Never invent timestamps.\n")
	sb.WriteString("4. Keep explanations clear, well-structured, and concise using markdown.\n\n")

	sb.WriteString("VIDEO TRANSCRIPT SEGMENTS:\n---\n")
	for _, seg := range segments {
		sb.WriteString(fmt.Sprintf("[%s] %s\n", seg.Timestamp, seg.Text))
	}
	sb.WriteString("---\n")

	systemMsg := Message{
		Role:    "system",
		Content: sb.String(),
	}

	messages := []Message{systemMsg}

	// Append recent conversation history
	for _, h := range history {
		if h.Role == "user" || h.Role == "assistant" {
			messages = append(messages, h)
		}
	}

	// Append current user query
	messages = append(messages, Message{
		Role:    "user",
		Content: query,
	})

	return messages
}
