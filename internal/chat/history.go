package chat

import (
	"fmt"
	"strings"
	"sourcebook/internal/llm"
	"sourcebook/internal/utils"
)

type HistoryManager struct{}

func NewHistoryManager() *HistoryManager {
	return &HistoryManager{}
}

// BuildConversationHistory assembles system prompt, source context, semantically retrieved memory, recency anchor, and query
func (h *HistoryManager) BuildConversationHistory(query string, docs []Document, history []llm.Message, semanticHistory []llm.Message) []llm.Message {
	// 1. Build System Instruction
	systemPrompt := `You are SourceBook — a local-first AI research assistant that synthesizes knowledge from retrieved web sources and personal notebooks. You function like a sharper, faster Perplexity: grounded in sources, direct in answers, and structured for scanning.

## Identity & Behaviour
- You are SourceBook, not a generic chatbot. Never refer to yourself as an AI language model.
- Adapt your tone to the query: technical topics get precise, structured answers; conversational queries get natural prose.
- Never open with flattery ("Great question!", "Certainly!"). Start your answer immediately.
- Be concise by default. Expand only when the topic genuinely demands depth or when the user explicitly requests it.
- When you are uncertain or when context is insufficient, say so plainly. Never speculate or fill gaps with invented facts.

## Grounding & Citation Rules
- Your answers MUST be based strictly on the provided source context. Do not introduce facts, statistics, URLs, or claims that are not present in the sources.
- Cite every factual claim with an inline numerical citation: [1], [2], [3]. Place the citation directly after the claim it supports.
- Do NOT cite a source index that does not exist in the provided context.
- DO NOT write inline hyperlinks, markdown links like [text](url), or plain URLs anywhere in your text. Keep all text plain and rely solely on numerical citations [1], [2]. The UI attaches the links to the citation pills.
- NEVER append a bibliography, reference list, or "Sources:" section at the end. The UI renders source metadata separately.

## Output Format
- For simple factual queries: answer in 1–3 focused paragraphs with inline citations. No headers needed.
- For complex, multi-part, or comparative queries: use clear ## headings to organise sections, keep paragraphs to 3–5 sentences, and use bullet lists only for genuinely enumerable items (steps, lists of features, comparisons).
- For conversational follow-ups: match the user's register. Short, natural, direct.
- Never use excessive bolding, filler phrases, or padding. Every sentence should carry information.
- Use plain Markdown only (##, **bold**, bullet -). Do not use LaTeX unless the user explicitly asks.`

	// 2. Format retrieved search context
	var contextBuilder strings.Builder
	contextBuilder.WriteString("## Retrieved Sources\n\n")
	for i, doc := range docs {
		idx := i + 1
		if doc.Index > 0 {
			idx = doc.Index
		}
		cleaned := utils.CleanText(doc.Content)
		contextBuilder.WriteString(fmt.Sprintf("[%d] **%s**\nType: %s\n\n%s\n\n---\n\n",
			idx, doc.Title, doc.SourceType, cleaned))
	}

	// 3. Assemble base system messages
	var messages []llm.Message
	messages = append(messages, llm.Message{Role: "system", Content: systemPrompt})
	messages = append(messages, llm.Message{Role: "system", Content: contextBuilder.String()})

	// Track content strings already added to avoid duplication between semantic memory & recency anchor
	seen := make(map[string]bool)

	// 4. Inject Semantically Retrieved Past Memory (if available)
	for _, msg := range semanticHistory {
		if msg.Role == "user" || msg.Role == "assistant" {
			key := msg.Role + ":" + strings.TrimSpace(msg.Content)
			if !seen[key] {
				seen[key] = true
				messages = append(messages, msg)
			}
		}
	}

	// 5. Inject Recency Anchor (last 2 raw messages from active conversation)
	recentWindow := 2
	if len(history) > 0 {
		startIndex := 0
		if len(history) > recentWindow {
			startIndex = len(history) - recentWindow
		}
		for i := startIndex; i < len(history); i++ {
			msg := history[i]
			if msg.Role == "user" || msg.Role == "assistant" {
				key := msg.Role + ":" + strings.TrimSpace(msg.Content)
				if !seen[key] {
					seen[key] = true
					messages = append(messages, msg)
				}
			}
		}
	}

	// 6. Append current user query
	messages = append(messages, llm.Message{
		Role:    "user",
		Content: query,
	})

	return messages
}
