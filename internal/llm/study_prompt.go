package llm

import (
	"fmt"
	"strings"
)

func buildSourceContext(docs []DocumentContext) string {
	var sb strings.Builder
	for _, doc := range docs {
		sb.WriteString(fmt.Sprintf("Source: %s\nContent:\n%s\n\n---\n\n", doc.Title, doc.Content))
	}
	return sb.String()
}

// BuildQuizPrompt constructs prompts for generating 4-choice multiple choice quiz questions.
func BuildQuizPrompt(docs []DocumentContext) []Message {
	systemPrompt := `You are a strict JSON-only quiz generator.
Your task is to generate 5 conceptual multiple-choice quiz questions based strictly on the provided source material.

Rules:
1. ONLY output valid JSON. Do not include markdown fences or conversational preambles.
2. The format MUST be an array of objects matching:
[
  {
    "id": 1,
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answerIndex": 0,
    "explanation": "Brief explanation of why this answer is correct based on the text."
  }
]
3. Exactly 4 options per question.
4. answerIndex must be the 0-based index (0, 1, 2, or 3) of the correct option.`

	userPrompt := fmt.Sprintf("Source Material:\n%s\nGenerate the JSON quiz.", buildSourceContext(docs))
	return []Message{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: userPrompt},
	}
}

// BuildFAQPrompt constructs prompts for generating question-and-answer pairs.
func BuildFAQPrompt(docs []DocumentContext) []Message {
	systemPrompt := `You are a strict JSON-only FAQ generator.
Generate 5 insightful Frequently Asked Questions (FAQ) with concise, accurate answers based on the provided text.

Rules:
1. ONLY output valid JSON. Do not include markdown fences or conversational text.
2. Format MUST be exactly:
[
  {"q": "Frequently asked question?", "a": "Comprehensive and clear answer."}
]`

	userPrompt := fmt.Sprintf("Source Material:\n%s\nGenerate the JSON FAQ.", buildSourceContext(docs))
	return []Message{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: userPrompt},
	}
}

// BuildBriefingPrompt constructs prompts for generating an executive research briefing.
func BuildBriefingPrompt(docs []DocumentContext) []Message {
	systemPrompt := `You are a strict JSON-only research analyst.
Generate an executive briefing document summarizing the core concepts from the provided text.

Rules:
1. ONLY output valid JSON. Do not include markdown fences or conversational text.
2. Format MUST be exactly:
{
  "summary": "High-level 2-3 paragraph executive summary of the domain.",
  "concepts": [
    {"term": "Concept Name", "definition": "Clear concise definition and why it matters."}
  ],
  "questions": [
    "Key research question or debate uncovered by the sources."
  ]
}`

	userPrompt := fmt.Sprintf("Source Material:\n%s\nGenerate the JSON briefing.", buildSourceContext(docs))
	return []Message{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: userPrompt},
	}
}

// BuildMindMapPrompt constructs prompts for generating a hierarchical concept tree.
func BuildMindMapPrompt(docs []DocumentContext) []Message {
	systemPrompt := `You are a strict JSON-only concept graph generator.
Extract a clean hierarchical knowledge tree from the provided source material.

Rules:
1. ONLY output valid JSON. Do not include markdown fences or conversational preambles.
2. Format MUST be a single root node with nested children matching this structure:
{
  "id": "root",
  "label": "Short Central Domain Topic (2-4 words)",
  "desc": "1-2 sentence core overview.",
  "children": [
    {
      "id": "node_1",
      "label": "Primary Category Name",
      "desc": "Explanation of this category.",
      "children": [
        {
          "id": "node_1_1",
          "label": "Specific Subtopic or Mechanism",
          "desc": "Key factual explanation from the sources."
        }
      ]
    }
  ]
}
3. Generate 3 to 4 primary children under root, and 2 to 3 sub-concepts under each primary child.
4. Keep labels punchy (2-5 words). Keep descriptions informative (1-2 sentences).`

	userPrompt := fmt.Sprintf("Source Material:\n%s\nGenerate the JSON mind map.", buildSourceContext(docs))
	return []Message{
		{Role: "system", Content: systemPrompt},
		{Role: "user", Content: userPrompt},
	}
}
