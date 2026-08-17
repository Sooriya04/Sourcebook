package chat

import (
	"encoding/json"
	"strings"
)

type ReActResponse struct {
	Thought     string `json:"thought"`
	Action      string `json:"action"` // "search_web", "search_notebook", "fetch_arxiv", "finish"
	ActionInput string `json:"action_input"`
}

const ReActSystemPrompt = `You are an agentic research assistant with access to tools to help answer user queries.
At each step, you MUST reason about what to do next and respond in this exact JSON format:

{
  "thought": "Brief explanation of what information is missing and why we need to call a tool.",
  "action": "one of: search_web, search_notebook, fetch_arxiv, finish",
  "action_input": "The search query or parameters for the action."
}

If you have sufficient context to answer the user query, use the "finish" action:
{
  "thought": "I have enough information to answer the question.",
  "action": "finish",
  "action_input": ""
}

Available Tools:
- search_web: Search the web for live, up-to-date information.
- search_notebook: Search local notebook resources.
- fetch_arxiv: Fetch details of a specific paper by its arXiv ID or URL.

Rules:
1. Always respond with ONLY the raw JSON structure, do not add other text.
2. If you choose "finish", your next turn will synthesize the final grounded response.
3. Be precise with your action parameters.`

// ParseReActJSON cleans up LLM output (e.g. markdown code blocks) and decodes the JSON ReAct response.
func ParseReActJSON(raw string) (*ReActResponse, error) {
	trimmed := strings.TrimSpace(raw)
	
	// Extract content between the first open brace '{' and last close brace '}'
	firstOpen := strings.Index(trimmed, "{")
	lastClose := strings.LastIndex(trimmed, "}")
	if firstOpen != -1 && lastClose > firstOpen {
		trimmed = trimmed[firstOpen : lastClose+1]
	}

	var res ReActResponse
	if err := json.Unmarshal([]byte(trimmed), &res); err != nil {
		return nil, err
	}
	return &res, nil
}
