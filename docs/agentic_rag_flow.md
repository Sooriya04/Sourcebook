# Agentic RAG Flow

The Agentic RAG Flow details the multi-step reasoning architecture where the LLM evaluates retrieved knowledge, determines if additional information is required, and synthesizes grounded answers.

---

## 🖼️ Flow Diagram

![Agentic RAG Flow](./images/Agentic%20RAG%20Flow.png)

---

## 🧠 Reasoning Cycle

1. **User Query Analysis**: Deconstructs user prompt into core informational intent.
2. **Context Retrieval**: Fetches relevant source documents and web snippets.
3. **Self-Reflective RAG**: Evaluates context completeness.
4. **Citation Grounding**: Enforces strict numeric citations matching source indices (`[1]`, `[2]`).
5. **Final Output Generation**: Streamed back to client UI.
