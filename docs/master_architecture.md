# Master Architecture Diagram

The Master Architecture Diagram illustrates the complete end-to-end data flow of **SourceBook**, spanning user input, search discovery, batch scraping, text normalization, grounded RAG synthesis, and notebook management.

---

## 🖼️ System Diagram

![Master Architecture Diagram](./images/The%20Master%20Diagram.png)

---

## 🏛️ Core Architectural Components

1. **NotebookLM Parity Frontend**:
   - Built with React + Vite.
   - Provides a 3-panel workspace: Left Sources Sidebar (with Source Discovery), Center Chat Studio, Right Studio/Notes Panel.

2. **SourceBook Core Server (`cmd/server/main.go`)**:
   - Pure Go HTTP backend router serving `/api/sourcebook/v1/*`.
   - Modular HTTP handlers strictly under 200 lines per file (`search_handler.go`, `pipeline_handler.go`, `chat_handler.go`, `job_handler.go`).

3. **Unified Search Controller & Registry**:
   - Manages concurrent search query execution across backends (SearXNG).
   - Deduplicates and ranks results before returning to the pipeline.

4. **Web Content Scraper (Searqon)**:
   - External Go service fetching web pages in parallel and extracting clean Markdown content.

5. **Grounded RAG Synthesizer**:
   - Connects to local Ollama (`gemma2`) or OpenAI API models to generate citation-aware answers (`[1]`, `[2]`).
