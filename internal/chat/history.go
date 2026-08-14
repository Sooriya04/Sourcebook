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

// BuildConversationHistory assembles system prompt, context, bounded history, and query
func (h *HistoryManager) BuildConversationHistory(query string, docs []Document, history []llm.Message) []llm.Message {
	// 1. Build System Instruction
	systemPrompt := `You are SourceBook Assistant, an intelligent Internet Knowledge Engine and grounded research assistant.
Your task is to provide clear, comprehensive, and accurate answers to user queries using ONLY facts from the provided search context.

Rules:
1. Base your answer strictly on the provided search context. Do not invent facts, domains, URLs, or citations.
2. Use inline numerical citations like [1], [2], [3] (exactly this format) to indicate which source a fact comes from. Do not cite sources that are not in the context.
3. If the retrieved context is insufficient to answer the query, state that clearly.
4. Keep the output clean, structured, and easy to read. Avoid claiming that you searched something when you did not.
5. Provide concise answers unless the user asks for more detail.
6. DO NOT append a bibliography, list of references, or sources list at the end of your response. Only use inline citations (e.g. [1], [2]) within your response text. The UI will display the references metadata separately.`

	// 2. Format retrieved search context
	var contextBuilder strings.Builder
	contextBuilder.WriteString("Search Context:\n\n")
	for i, doc := range docs {
		cleaned := utils.CleanText(doc.Content)
		contextBuilder.WriteString(fmt.Sprintf("[%d] Source: %s\nURL: %s\nType: %s\nContent:\n%s\n\n---\n\n",
			i+1, doc.Title, doc.URL, doc.SourceType, cleaned))
	}

	// 3. Assemble messages slice
	var messages []llm.Message
	messages = append(messages, llm.Message{Role: "system", Content: systemPrompt})
	messages = append(messages, llm.Message{Role: "system", Content: contextBuilder.String()})

	// 4. Bound conversation history (keep last 6 messages/turns to avoid context overload)
	maxHistoryMessages := 6
	startIndex := 0
	if len(history) > maxHistoryMessages {
		startIndex = len(history) - maxHistoryMessages
	}

	// Filter out any system messages in history to prevent LLM prompt injection
	for i := startIndex; i < len(history); i++ {
		msg := history[i]
		if msg.Role == "user" || msg.Role == "assistant" {
			messages = append(messages, msg)
		}
	}

	// 5. Append current user query
	messages = append(messages, llm.Message{
		Role:    "user",
		Content: fmt.Sprintf("User Query: %s\n\nProvide a comprehensive grounded answer with inline citations [1], [2], etc.", query),
	})

	return messages
}
