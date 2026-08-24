# SourceBook — Agent Context

This document is intended for AI coding agents (Codex, Cursor, Claude, Gemini, etc.) to understand
the structure, philosophy, vision, and conventions of this project before making changes.

---

## 🎯 What is SourceBook?

SourceBook is an **Open-Source, Local-First NotebookLM + Perplexity Hybrid** built in Go.

It serves as a unified intelligence platform that queries multiple internet sources simultaneously via **SearXNG**, extracts clean markdown via **Searqon**, ingests user documents (PDFs, Markdown, Audio/Video transcripts), and feeds a grounded LLM synthesis pipeline for AI reasoning with strict numerical citations (`[1]`, `[2]`).

---

## 🏛️ Product Architecture & NotebookLM Parity Matrix

| Feature | NotebookLM (Cloud) | SourceBook (Open Source & Local-First) | Status |
| :--- | :--- | :--- | :--- |
| **Search Engine** | Google Search | SearXNG (`searqon-searxng-1` Docker container) | ✅ Implemented |
| **Web Crawler** | Proprietary Cloud Crawler | Searqon (Parallel Go Scraper) | ✅ Implemented |
| **RAG Synthesis** | Gemini 1.5 Pro | Local LLMs (Ollama / `gemma2`) & OpenAI APIs | ✅ Implemented |
| **Grounded Citations** | Clickable Citations | Inline numerical citations (`[1]`, `[2]`) | ✅ Implemented |
| **Text Cleaning** | Auto Sanitization | `utils.CleanText()` (Whitespace/Newline Normalization) | ✅ Implemented |
| **Notebook Store** | Cloud Storage | Local SQLite + Vector Storage | 🚧 In Progress |
| **File Ingestion** | Google Drive / PDFs | Local PDF, Markdown, Text, YouTube transcripts | 🚧 In Progress |
| **Audio Overview** | Deep Dive Podcast (2 Hosts) | Local TTS (Kokoro / Piper / Bark) Audio Synthesis | 🔮 Planned |

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Language** | Go (all backend) |
| **HTTP Server** | `net/http` (stdlib, no framework) |
| **Config** | `.env` via `godotenv` |
| **Web Scraper** | Searqon (separate Go microservice at `http://127.0.0.1:4001`) |
| **Search Engine** | SearXNG (`http://localhost:8080`) |
| **LLM Provider** | Ollama (e.g. `gemma2`) / OpenAI compatible endpoints |
| **Database** | SQLite + local indexers (for Notebooks & Sources) |

---

## 📁 Project Structure

All Go files are strictly modularized and kept **under 200 lines per file**.

```
sourcebook/
├── cmd/server/main.go          # Entrypoint — wires HTTP routes & dependencies
├── internal/
│   ├── api/                    # Modular HTTP handlers (< 200 lines each)
│   │   ├── api.go              # API struct and constructor
│   │   ├── search_handler.go   # GET/POST /search handler
│   │   ├── pipeline_handler.go # POST /pipeline (Search + Scrape + Clean)
│   │   ├── chat_handler.go     # POST /chat (Grounded RAG synthesis handler)
│   │   └── job_handler.go      # GET /jobs handler
│   ├── controller/
│   │   └── search.go           # Unified Search Controller (concurrent dispatch)
│   ├── llm/                    # LLM completion & prompt formatting
│   │   ├── client.go           # Client supporting Ollama & OpenAI
│   │   ├── prompt.go           # Grounded RAG prompt builder
│   │   └── types.go            # LLM data structures
│   ├── synthesis/              # RAG Orchestration engine
│   │   └── synthesizer.go      # Cleans docs & synthesizes grounded answer
│   ├── utils/                  # Text utilities
│   │   └── cleaner.go          # Whitespace & line-break normalization
│   ├── models/                 # Shared domain data types
│   ├── providers/              # Pluggable search providers (SearXNG)
│   └── registry/               # Provider registry
├── .env                        # Environment config
├── docs/.github/commits.md     # Granular commit history & changelog (Refer here for detailed development status)
└── AGENTS.md                   # This file
```

---

## ⚙️ Environment Variables (`.env`)

```env
SEARXNG_URL=http://localhost:8080                  # SearXNG Docker instance
SEARQON_SCRAPE_URL=http://127.0.0.1:4001/scrape/batch # Searqon scraper endpoint
PORT=5000                                          # SourceBook server port

# LLM Configuration
LLM_PROVIDER=ollama                                # "ollama" or "openai"
LLM_URL=http://localhost:11434                     # Ollama URL or OpenAI endpoint
LLM_MODEL=gemma2                                   # LLM model name
LLM_API_KEY=                                       # API key (optional for OpenAI)
```

---

## 📡 API Endpoints

All endpoints are versioned under `/api/sourcebook/v1/`.

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/sourcebook/v1/search?q=...` | Search via SearXNG, returns normalized JSON |
| `POST` | `/api/sourcebook/v1/search` | Search via JSON payload `{query, options}` |
| `POST` | `/api/sourcebook/v1/pipeline` | Search → Scrape → Cleaned Markdown response |
| `POST` | `/api/sourcebook/v1/chat` | Full Grounded RAG Synthesis: Search → Scrape → Clean → LLM Answer |
| `GET` | `/api/sourcebook/v1/jobs/{id}` | Status & records of an ingestion job |
| `GET` | `/health` | Server health check |

---

## 🗺️ Product Roadmap

- [x] **Phase 1: Search & Web Ingestion Pipeline** (SearXNG discovery + Searqon batch scraping)
- [x] **Phase 2: Grounded RAG Engine & Text Cleaner** (Stripping bloat + LLM synthesis + `[1]`, `[2]` citations)
- [x] **Phase 3: Local Notebooks & Document Ingestion** (SQLite persistence + PDF, Markdown, YouTube URL ingestion)
- [ ] **Phase 4: Agentic RAG** (Query decomposition, BM25/Vector re-ranking, multi-turn chat memory)
- [ ] **Phase 5: Audio Overview / Podcast Synthesis** (Generating 2-host summary dialogues + Local TTS)
- [ ] **Phase 6: Google Workspace Integration (Version 2)** (Google Drive file, Sheets, and Gmail ingestion using local `gws` client)

---

## 📜 Coding Conventions & Rules

1. **Modular Files** — Keep every single file focused and strictly **under 200 lines**.
2. **Clean Text** — Always pass scraped or ingested text through `utils.CleanText()` before returning or feeding to LLMs.
3. **Grounded Answers** — Use inline numerical citations `[1]`, `[2]` for AI generated answers based strictly on retrieved sources.
4. **No Direct Git Commits** — Do not commit directly to remote repository/GitHub unless explicitly requested by the user.
5. **Development Status Reference** — Always refer to `docs/.github/commits.md` for detailed historical context, implemented features, and recent changelogs.
