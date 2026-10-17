<div align="center">

# 📚 SourceBook

**Open-Source, Local-First NotebookLM + Perplexity Hybrid**

[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat&logo=go)](https://go.dev/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0+-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](docker/docker-compose.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

*A privacy-first intelligence platform that concurrently queries search providers via SearXNG & DuckDuckGo, extracts clean markdown via Searqon, ingests multi-format documents, and synthesizes grounded answers with strict numerical citations (`[1]`, `[2]`).*

[Quickstart](#-quickstart) • [Feature Matrix](#-feature-comparison) • [Architecture](#-architecture) • [LLM Providers](#-frontend-llm-configuration) • [Contributing](#-contributing)

</div>

---

## ⚡ Why SourceBook?

Cloud-based research notebooks lock your private data into proprietary ecosystems, while search engines often generate ungrounded hallucinations. **SourceBook** bridges this gap by combining the deep document grounding of **NotebookLM** with the real-time discovery and citation speed of **Perplexity**—all running locally on your hardware.

### 🏛️ Feature Comparison

| Feature | Cloud NotebookLM | Perplexity AI | SourceBook (Open Source) |
| :--- | :---: | :---: | :---: |
| **Privacy & Storage** | Proprietary Cloud | Cloud Server | **100% Local (SQLite WAL + Vector Store)** |
| **LLM Inference** | Proprietary Cloud API | Cloud APIs | **Any Provider (Ollama, OpenAI, Groq, NVIDIA NIM)** |
| **Grounded Citations** | ✅ Yes (`[1]`, `[2]`) | ✅ Yes | **✅ Strict Inline Numerical Citations** |
| **Web Discovery Engine** | ❌ None | Proprietary Index | **SearXNG + DuckDuckGo Parallel Metasearch** |
| **Web Scraping & Cleaning** | Cloud Crawler | Web Links | **Searqon Parallel Scraper + Text Normalization** |
| **Document Ingestion** | Drive Uploads | Web Links | **PDF, Markdown, Plain Text, YouTube Transcripts, arXiv** |
| **Drag & Drop Ingestion** | Modal only | ❌ None | **Global Drag & Drop + Direct URL Paste** |
| **Source Scoping** | Checkboxes | Collections | **Granular Checkboxes + Dossier Inspector** |
| **Study Studio** | Audio Overview | ❌ None | **Flashcards, Quizzes, Briefs, Mind Maps** |
| **Self-Hostable** | ❌ No | ❌ No | **✅ Single Binary, Make, or Docker Compose** |

---

## 🚀 Quickstart

### Option 1: Docker Compose (Recommended)

Run the containerized stack (SourceBook, SearXNG, YouTube extraction microservice) with a single command:

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

# 3. Build and launch using the Makefile (handles UI build & backend supervisor)
make run

# Alternatively, manual build:
cd ui && npm install && npm run build && cd ..
./run.sh
```

---

## 🧠 Workstation Settings & LLM Configuration

Configure inference endpoints, credentials, and search providers directly within the browser interface under **Settings (`/settings`)**:

- **Provider Protocols**:
  - **OpenAI Compatible**: Custom local proxies, vLLM, LM Studio, or OpenAI endpoints.
  - **Ollama Native**: Direct local daemon at `http://localhost:11434` (`gemma2`, `phi4-mini`, `llama3.3`).
  - **Groq Cloud**: High-speed LPU inference via `api.groq.com`.
  - **NVIDIA NIM**: Cloud NIM endpoints via `integrate.api.nvidia.com`.
- **Credential Security**: Dedicated eye reveal toggle to inspect or mask API keys.
- **Connection Testing**: Built-in **"Test Connection & Key"** probe validates endpoints before saving.
- **Search & Scraping Routing**: Configure DuckDuckGo, local SearXNG URL, and Searqon batch scraper endpoints.
- **Persistent Storage**: All settings are safely stored in local SQLite (`user_settings`) and `localStorage`.

---

## 🎨 Interactive Capabilities

- **Resilient 3-Panel Workspace**: Dynamic flexbox layout with independent toggle controls for Sources, Chat, and Study Studio.
- **Global Drag & Drop**: Drop `.pdf`, `.md`, or `.txt` files anywhere onto the workspace to ingest immediately.
- **Direct URL Ingestion**: Paste any web article, arXiv paper, or YouTube URL to scrape and index automatically.
- **Floating Prompt Dock**: Centered multi-line prompt dock with instant slash command palette:
  - `/summarize` — Executive briefing across all active sources.
  - `/explain` — Deep explanation of mechanisms and concepts.
  - `/compare` — Analyze agreements and contradictions between sources.
  - `/quiz` — Generate conceptual active recall flashcards.
- **Source Dossier Inspector**: Inspect full extracted source markdown, reading metrics, and word counts with single-click inspection.
- **One-Click Notes**: Save any synthesized AI answer directly into persistent workspace notes.

---

## 🏗️ Architecture

```
sourcebook/
├── cmd/server/main.go          # Server entrypoint & route multiplexer
├── database/                   # Persistent SQLite database (sourcebook.db)
├── docker/                     # Container orchestration & build files
│   ├── docker-compose.yml      # Multi-container service definitions
│   ├── Dockerfile              # Multi-stage production container
│   └── .dockerignore           # Container build exclusions
├── internal/
│   ├── api/                    # Modular REST & SSE handlers (< 200 lines each)
│   ├── chat/                   # Hybrid BM25/Vector reranker & Graph state tracer
│   ├── database/               # SQLite WAL repository & schema migrations
│   ├── llm/                    # Streaming LLM client (Ollama / OpenAI / Groq / NIM)
│   ├── providers/              # Search providers (SearXNG, DuckDuckGo)
│   ├── synthesis/              # Grounded answer synthesis engine
│   └── utils/                  # Text sanitization & normalization
├── services/                   # Modular microservices
│   ├── document/               # PDF, Markdown, and TXT parsing service
│   ├── embedding/              # Local ONNX / Sentence-transformers embeddings
│   ├── jina/                   # Jina Reader web & arXiv extraction service
│   ├── reddit/                 # Reddit thread extraction service
│   ├── social/                 # RSS/Atom and social media parser
│   └── youtube/                # YouTube spoken audio transcript service
├── ui/                         # React 19 + Vite responsive workstation
│   ├── src/components/chat/    # ChatStudio, MessageBubble, PromptBar
│   ├── src/components/notebook/# NotebookCard, CreateNotebookCard, SearchBar
│   ├── src/components/settings/# Modular Settings Suite & Provider subcomponents
│   ├── src/components/sources/ # SourceList, SourceCard, SourceInspector
│   ├── src/components/study/   # AudioOverview, QuizView, MindMapView
│   └── src/pages/              # NotebookPage, SettingsPage, HomePage
├── Makefile                    # Unified build & development orchestration
└── run.sh                      # Local developer supervisor script
```

---

## 🔒 Security & Privacy

- **No Data Telemetry**: Your queries, documents, and notes never leave your self-hosted instance.
- **Zero Committed Secrets**: All credentials remain strictly within local `.env` or SQLite storage.
- **Strict Grounded Citations**: Answers strictly reference context numbers `[1]`, `[2]`, traceable to source excerpts.

---

## 🤝 Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on branch naming, code style, and PR requirements.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.
