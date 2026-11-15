<div align="center">

# 📚 SourceBook

**Open-Source, Local-First NotebookLM + Perplexity Hybrid**

[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat&logo=go)](https://go.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![SQLite](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57?style=flat&logo=sqlite)](https://www.sqlite.org/)
[![TTS](https://img.shields.io/badge/Kokoro-82M%20ONNX-FF6F00?style=flat&logo=soundcharts)](https://github.com/hexgrad/kokoro)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](docker/docker-compose.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

*A privacy-first intelligence workstation combining real-time internet metasearch (SearXNG & DuckDuckGo), parallel markdown extraction (Searqon), multi-document ingestion (PDF, Markdown, arXiv, YouTube), hybrid vector/BM25 grounded RAG with strict numerical citations (`[1]`, `[2]`), and local 2-host audio podcast synthesis.*

[Quickstart](#-quickstart) • [Capabilities](#-interactive-capabilities) • [Service Ports](#-service-ports--architecture) • [LLM Configuration](#-workstation-settings--llm-configuration) • [API Endpoints](#-api-endpoints) • [Contributing](#-contributing)

</div>

---

## 🚀 Quickstart

### Option 1: Docker Compose (Recommended)

Run the full containerized stack (SourceBook server, SearXNG, YouTube extraction microservice, Kokoro audio TTS) with a single command:

```bash
# 1. Clone repository
git clone https://github.com/Sooriya04/Sourcebook.git
cd Sourcebook

# 2. Copy environment template
cp .env.example .env

# 3. Spin up the cluster
docker compose -f docker/docker-compose.yml up --build

# Or using Makefile
make docker-up
```

Access the web interface at **`http://localhost:5000`**.

---

### Option 2: Local Native Run

**Prerequisites:** Go 1.22+, Node.js 20+, Python 3.10+

```bash
# 1. Clone repository
git clone https://github.com/Sooriya04/Sourcebook.git
cd Sourcebook

# 2. Configure environment
cp .env.example .env

# 3. Install dependencies and build
make install
make build

# 4. Launch unified stack
./run.sh
```

---

## 🔌 Service Ports & Architecture

SourceBook connects modular microservices through high-speed internal endpoints:

| Port | Service | Technology | Description |
| :---: | :--- | :--- | :--- |
| **`5000`** | **SourceBook Server & UI** | Go (`net/http`) + React 19 | Core API, RAG orchestration, SQLite repository, and SPA frontend |
| **`6001`** | **YouTube Transcript Service** | Python (`FastAPI`) | YouTube transcript extraction, search, and segment timing |
| **`6002`** | **Embedding Microservice** | Python (`ONNX Runtime`) | Local dense embeddings via `all-MiniLM-L6-v2` (384-dim) |
| **`6003`** | **Kokoro Audio TTS Service** | Python (`FastAPI` + Kokoro ONNX) | 2-host audio podcast synthesis with real-time SSE streaming |
| **`8080`** | **SearXNG Metasearch** | Python (`Docker`) | Private, multi-engine internet search aggregation |
| **`4001`** | **Searqon Scraper** | Go microservice | Concurrent web scraping, crawl queues, and markdown cleaning |

---

## 🧠 Workstation Settings & LLM Configuration

Configure inference endpoints, credentials, and search providers directly within the browser interface under **Settings (`/settings`)**:

- **Supported LLM Protocols**:
  - **Ollama Native**: Direct local daemon at `http://localhost:11434` (`gemma2`, `phi4-mini`, `llama3.3`, `qwen2.5`).
  - **OpenAI Compatible**: Custom local proxies, vLLM, LM Studio, or OpenAI endpoints.
  - **Groq Cloud**: Ultra-low-latency LPU inference via `api.groq.com`.
  - **NVIDIA NIM**: High-throughput cloud NIM endpoints via `integrate.api.nvidia.com`.
- **Dynamic Model Verification**: Built-in **"Test Connection & Key"** probe verifies models and API keys before saving.
- **Search Provider Routing**: Toggle between DuckDuckGo, SearXNG, or both with custom result splits.
- **Persistent Storage**: All settings are persisted safely to local SQLite (`user_settings`) and synced across sessions.

---

## 🎨 Interactive Capabilities

- **Resilient 3-Panel Workspace**: Dynamic layout with collapsible panels for Sources, Chat, and Study Studio.
- **Deep Dive Audio Podcast**: Synthesizes 2-host conversational dialogues from your notebook sources using local Kokoro-82M TTS with real-time progress streaming.
- **YouTube Watch & Chat Cockpit (`/youtube/:videoId`)**: Watch YouTube videos with interactive chapter navigation and ask questions with exact timestamp-grounded citations.
- **Executive Notebook Briefings**: Instant executive summaries, key topics, and suggested exploration prompts generated for each notebook.
- **Global Drag & Drop**: Drop `.pdf`, `.md`, or `.txt` files anywhere onto the workspace to ingest immediately.
- **Direct URL Ingestion**: Paste web articles, arXiv papers, or YouTube URLs to extract and index automatically.
- **Floating Prompt Dock with Slash Commands**:
  - `/summarize` — Executive briefing across all active sources.
  - `/explain` — Deep explanation of mechanisms and core concepts.
  - `/compare` — Analyze agreements and contradictions across sources.
  - `/quiz` — Generate interactive study flashcards.
- **Source Dossier Inspector**: Inspect extracted source markdown, reading metrics, and word counts with one click.
- **One-Click Notes**: Save any synthesized AI answer directly into persistent workspace notes.

---

## 📡 API Endpoints

All core API endpoints are versioned under `/api/sourcebook/v1/`:

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/sourcebook/v1/notebooks` | List all research notebooks and source counts |
| `POST` | `/api/sourcebook/v1/notebooks` | Create a new research notebook |
| `GET` | `/api/sourcebook/v1/notebooks/{id}` | Get notebook details, sources, notes, and messages |
| `PUT` | `/api/sourcebook/v1/notebooks/{id}` | Update notebook sources, notes, and messages |
| `GET` | `/api/sourcebook/v1/notebooks/{id}/guide` | Get executive summary briefing and exploration questions |
| `POST` | `/api/sourcebook/v1/chat` | Grounded RAG query synthesis (JSON response) |
| `POST` | `/api/sourcebook/v1/chat/stream` | Real-time grounded RAG synthesis via SSE |
| `POST` | `/api/sourcebook/v1/study/podcast/stream` | Stream 2-host audio podcast synthesis via SSE |
| `GET` | `/api/sourcebook/v1/study/podcast/episodes`| List generated podcast episodes for a notebook |
| `GET` | `/api/sourcebook/v1/study/audio/{id}` | Stream generated `.wav` audio or episode metadata |
| `POST` | `/api/sourcebook/v1/study/flashcards` | Generate conceptual study flashcards |
| `POST` | `/api/sourcebook/v1/youtube/details` | Extract YouTube metadata, chapters, and segments |
| `POST` | `/api/sourcebook/v1/youtube/chat` | Streaming timestamp-grounded video chat via SSE |
| `POST` | `/api/sourcebook/v1/search` | Direct search across SearXNG and DuckDuckGo |
| `POST` | `/api/sourcebook/v1/discovery` | Rapid web discovery search via Searqon |
| `POST` | `/api/sourcebook/v1/pipeline` | Search → Scrape → Clean markdown pipeline |
| `POST` | `/api/sourcebook/v1/sources/ping` | Safe SSRF-protected source reachability probe |
| `POST` | `/api/sourcebook/v1/parse/pdf` | Multipart PDF parsing and text normalization |
| `POST` | `/api/sourcebook/v1/parse/markdown` | Multipart markdown/text parsing and normalization |
| `GET` | `/health` | Server health check |

---

## 🏗️ Architecture & Project Structure

```
sourcebook/
├── cmd/server/main.go          # Server entrypoint & HTTP route multiplexer
├── database/                   # Persistent SQLite database (sourcebook.db)
├── docker/                     # Container orchestration & build files
│   ├── docker-compose.yml      # Multi-container service definitions
│   ├── Dockerfile              # Multi-stage production container
│   └── .dockerignore           # Container build exclusions
├── internal/
│   ├── agent/                  # Background Sentinel repair engine & scrape healing
│   ├── api/                    # Modular REST & SSE handlers (< 200 lines each)
│   ├── arxiv/                  # Dedicated arXiv paper scraper & abstract parser
│   ├── chat/                   # Hybrid BM25/Vector RRF reranker & ReAct loop
│   ├── controller/             # Unified search controller (SearXNG + DDG)
│   ├── database/               # SQLite WAL repository, migrations & repos
│   ├── llm/                    # Streaming LLM client (Ollama / OpenAI / Groq / NIM)
│   ├── models/                 # Domain structs & request/response payloads
│   ├── pipeline/               # Search-and-scrape job pipeline store & indexer
│   ├── providers/              # Search providers (SearXNG, DuckDuckGo)
│   ├── registry/               # Provider registry
│   ├── synthesis/              # Grounded answer & podcast dialogue synthesizer
│   ├── utils/                  # Text sanitization (CleanText) & client helpers
│   └── vector/                 # Dense vector chunker, ONNX client & subprocess
├── services/                   # Modular microservices
│   ├── audio/                  # Kokoro-82M ONNX TTS 2-host audio synthesizer (:6003)
│   ├── embedding/              # Local ONNX all-MiniLM-L6-v2 vector embedder (:6002)
│   └── youtube/                # YouTube transcript & chapter extractor (:6001)
├── ui/                         # React 19 + Vite responsive workstation
│   ├── src/components/chat/    # ChatStudio, MessageBubble, PromptDock
│   ├── src/components/notebook/# NotebookCard, CreateNotebookModal, Palette
│   ├── src/components/settings/# Modular Settings Suite (LLM, Search, Media)
│   ├── src/components/sources/ # SourceList, SourceInspector, AddSourceModal
│   ├── src/components/study/   # AudioOverviewView, Flashcards, MindMapView
│   └── src/pages/              # NotebookPage, YouTubeChatPage, SettingsPage
├── Makefile                    # Unified build & development orchestration
├── run.sh                      # Local developer supervisor script
└── AGENTS.md                   # Agent conventions (< 200 lines rule & architecture)
```

---

## 🔒 Security & Privacy

- **No External Telemetry**: Your documents, queries, and research notes remain strictly on your local machine.
- **SSRF Defense**: The source reachability checker validates IP addresses and blocks private, loopback, and link-local ranges (`127.0.0.0/8`, `10.0.0.0/8`, `169.254.0.0/16`, etc.).
- **Zero Committed Secrets**: API keys are saved exclusively in your local SQLite store and are never logged or committed.
- **Strict Grounding**: Answers cite exact numerical indices `[1]`, `[2]` strictly supported by retrieved source text.

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on code conventions and PR requirements.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Ensure all tests pass (`go test ./...`) and file lengths adhere to the `<200 lines` rule (`make lines`)
4. Commit your Changes (`git commit -m 'Add AmazingFeature'`)
5. Push to the Branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.
