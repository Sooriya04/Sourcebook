package llm

import (
	"fmt"
	"strings"
)

// DocumentContext represents a scraped document fed to the LLM.
type DocumentContext struct {
	Index   int
	Title   string
	URL     string
	Content string
}

// BuildPrompt constructs a grounded system and user prompt with source context.
func BuildPrompt(query string, docs []DocumentContext) ([]Message, []SourceCitation) {
	var contextBuilder strings.Builder
	var citations []SourceCitation

	for _, doc := range docs {
		idx := doc.Index
		citations = append(citations, SourceCitation{
			Index: idx,
			Title: doc.Title,
			URL:   doc.URL,
		})

		contextBuilder.WriteString(fmt.Sprintf("[%d] Source: %s\nURL: %s\nContent:\n%s\n\n---\n\n",
			idx, doc.Title, doc.URL, doc.Content))
	}

	systemPrompt := `You are SourceBook, an intelligent Internet Knowledge Engine.
Your task is to provide a clear, accurate, and comprehensive answer to the user's query using ONLY the provided search source context.

Rules:
1. Base your answer strictly on the provided sources. Do not make up facts.
2. Use inline numerical citations like [1], [2] to indicate where facts come from.
3. If the sources do not contain enough information to answer, state what is missing clearly.
4. Keep the output clean, structured, and easy to read.`

	userPrompt := fmt.Sprintf("User Query: %s\n\nSearch Context:\n%s\nProvide a comprehensive grounded answer with inline citations [1], [2], etc.",
		query, contextBuilder.String())

	messages := []Message{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: userPrompt},
	}

	return messages, citations
}

// BuildFlashcardPrompt constructs a system and user prompt for generating JSON flashcards.
func BuildFlashcardPrompt(docs []DocumentContext) []Message {
	var contextBuilder strings.Builder

	for _, doc := range docs {
		contextBuilder.WriteString(fmt.Sprintf("Source: %s\nContent:\n%s\n\n---\n\n", doc.Title, doc.Content))
	}

	systemPrompt := `You are a strict JSON-only flashcard generator.
Your task is to extract key facts, concepts, and definitions from the provided text and turn them into a JSON array of flashcards.

Rules:
1. ONLY output valid JSON. Do not include markdown blocks like ` + "```json" + ` or conversational text.
2. The format MUST be exactly:
[
  {"q": "Question text here?", "a": "Answer text here."},
  {"q": "Another question?", "a": "Another answer."}
]
3. Generate exactly 5 flashcards.`

	userPrompt := fmt.Sprintf("Source Material:\n%s\nGenerate the JSON flashcards.", contextBuilder.String())

	return []Message{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: userPrompt},
	}
}

// BuildPodcastPrompt constructs a prompt to generate a 2-host podcast conversation.
func BuildPodcastPrompt(docs []DocumentContext) []Message {
	var contextBuilder strings.Builder

	for _, doc := range docs {
		contextBuilder.WriteString(fmt.Sprintf("Source: %s\nContent:\n%s\n\n---\n\n", doc.Title, doc.Content))
	}

	systemPrompt := `You are an expert audio producer creating a conversational "Deep Dive" podcast overview.
Two co-hosts, Austin and Taylor, are having an engaging, natural, and insightful discussion exploring the user's workspace notes and documents.

Rules:
1. Format your response strictly as a JSON array of conversational turns.
2. The co-hosts have distinct personalities:
   - "Austin" (Host 1): Enthusiastic, curious, frames the big picture, asks insightful questions.
   - "Taylor" (Host 2): Analytical, detail-oriented, dives into nuances, examples, and surprising takeaways.
3. Make the dialogue sound natural: use natural transitions, back-and-forth reactions ("Right!", "That's wild", "Exactly"), and clear explanations of the source concepts.
4. Output ONLY valid JSON without any markdown formatting or code blocks:
[
  {"speaker": "austin", "name": "Austin", "text": "Welcome back! Today we are digging into..."},
  {"speaker": "taylor", "name": "Taylor", "text": "Yeah, and what immediately stood out to me was..."}
]
5. Generate between 4 to 8 high-impact dialogue turns that synthesize the main themes.`

	userPrompt := fmt.Sprintf("Source Materials:\n%s\nGenerate the JSON podcast dialogue.", contextBuilder.String())

	return []Message{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: userPrompt},
	}
}

