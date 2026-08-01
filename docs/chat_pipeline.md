# Chat Pipeline

The Chat Pipeline powers end-to-end user Q&A interactions over ingested web content and local sources.

---

## 🖼️ Chat Pipeline Diagram

![Chat Pipeline](./images/Chat%20Pipeline.png)

---

## 💡 Key Features

1. **Endpoint**: `POST /api/sourcebook/v1/chat`
2. **Context Assembly**: Concatenates sanitized content from active notebook sources.
3. **Prompt Formatting**: Uses `internal/llm/prompt.go` to construct strict system prompts demanding numerical citations (`[1]`, `[2]`).
4. **LLM Provider Execution**: Sends prompts to Ollama (`gemma2`) or configured OpenAI models.
5. **Client Rendering**: Renders Markdown chat bubbles in the center Chat Studio with clickable citation triggers.
