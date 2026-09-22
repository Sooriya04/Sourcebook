<div align="center">

# 📚 SourceBook

**Open-Source, Local-First NotebookLM + Perplexity Hybrid**

[![Go Version](https://img.shields.io/badge/Go-1.22+-00ADD8?style=flat&logo=go)](https://go.dev/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](docker-compose.yml)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

*A privacy-first intelligence platform that concurrently queries search providers, extracts clean markdown, ingests multi-format documents, and synthesizes grounded answers with strict numerical citations (`[1]`, `[2]`).*

[Quickstart](#-quickstart) • [Feature Matrix](#-feature-comparison) • [Architecture](#-architecture) • [LLM Providers](#-frontend-llm-configuration) • [Contributing](#-contributing)

</div>

---

## ⚡ Why SourceBook?

Cloud-based research notebooks lock your private data into proprietary ecosystems, while search engines often generate ungrounded hallucinations. **SourceBook** bridges this gap by combining the deep document grounding of **NotebookLM** with the real-time discovery and citation speed of **Perplexity**—all running locally on your hardware.

### 🏛️ Feature Comparison

| Feature | Google NotebookLM | Perplexity AI | SourceBook (Open Source) |
| :--- | :---: | :---: | :---: |
| **Privacy & Storage** | Cloud (Google Drive) | Cloud Server | **100% Local (SQLite + WAL)** |
| **LLM Inference** | Gemini (Locked) | Cloud APIs | **Any Provider (Ollama, OpenAI, Groq, 9router)** |
| **Grounded Citations** | ✅ Yes (`[1]`, `[2]`) | ✅ Yes | **✅ Strict Numerical Citations** |
| **Web Search Discovery** | ❌ None | Proprietary Index | **SearXNG + DuckDuckGo Failover** |
| **Multi-Format Ingestion** | PDFs, Docs | Web Links | **PDF, MD, TXT, YouTube Transcripts, Web** |
| **Drag & Drop Ingestion** | Modal only | ❌ None | **Global Drag & Drop + Direct URL Paste** |
| **Source Scoping** | Checkboxes | Collections | **Granular Checkboxes + Dossier Inspector** |
| **Audio & Study Studio** | Cloud Audio Overview | ❌ None | **Flashcards, Quizzes, Briefs, Mind Maps** |
| **Self-Hostable** | ❌ No | ❌ No | **✅ Single Binary or Docker Compose** |

---

## 🚀 Quickstart

### Option 1: Docker Compose (Recommended)

Run the complete stack (SourceBook, SearXNG, YouTube extraction microservice) with a single command:

```bash
# 1. Clone repository
git clone https://github.com/Sooriya04/Sourcebook.git
cd Sourcebook

# 2. Copy environment template
cp .env.example .env

# 3. Spin up the cluster
docker compose up --build
```

Access the web interface at **`http://localhost:5000`**.

---

### Option 2: Local Native Run

**Prerequisites:** Go 1.22+, Node.js 20+, Python 3.10+

```bash
# 1. Clone and enter
git clone https://github.com/Sooriya04/Sourcebook.git
cd Sourcebook

# 2. Configure environment
cp .env.example .env

# 3. Build React UI
cd ui && npm install && npm run build && cd ..

# 4. Launch with unified launcher
./run.sh
```

---

## 🧠 Frontend LLM Configuration

SourceBook allows configuring and testing your LLM provider directly within the browser interface under **Settings (`/settings`)**:

- **Ollama (Default / Local)**: `http://localhost:11434` with `gemma2`, `phi4-mini`, `llama3.2`, or `mistral`.
- **OpenAI Compatible**: Custom endpoints, vLLM, LM Studio, or 9router (`http://localhost:20128/v1`).
- **Groq Cloud / NVIDIA NIM**: High-throughput hosted inference with API keys.
- **Verification**: Built-in **"⚡ Test Connection & Key"** button validates credentials before saving.
- **Persistence**: Preferences are automatically saved in local SQLite (`user_settings`) and `localStorage`.

---

## 🎨 Interactive Capabilities

- **Global Drag & Drop**: Drop `.pdf`, `.md`, or `.txt` files anywhere onto the workspace to ingest immediately.
- **Direct URL Detection**: Paste any article or YouTube link in the chat prompt bar to ingest with one click.
- **Slash Commands**: Type `/` in the prompt input for instant prompts:
  - `/summarize` — Executive briefing across all active sources.
  - `/explain` — Deep explanation of mechanisms and concepts.
  - `/compare` — Identify agreements and contradictions between sources.
  - `/quiz` — Generate 5 conceptual study flashcards.
- **Interactive Follow-ups**: Suggested exploration chips generate dynamically beneath each assistant answer.
- **Source Dossier Inspector**: Double-click any source card for reading time metrics, word counts, and single-source isolated chat.
- **One-Click Notes**: Save any synthesis directly to the interactive Notes panel.

---

## 🏗️ Architecture

```
sourcebook/
├── cmd/server/main.go          # Server entrypoint & route multiplexer
├── internal/
│   ├── api/                    # REST & SSE Handlers (< 200 lines each)
│   ├── chat/                   # Hybrid BM25/Vector reranker & Graph tracer
│   ├── database/               # SQLite WAL repository & settings persistence
│   ├── llm/                    # Streaming LLM client (Ollama / OpenAI / 9router)
│   ├── providers/              # Search providers (SearXNG, DuckDuckGo)
│   └── utils/                  # Text cleaner & sanitization pipelines
├── services/
│   ├── youtube/                # Python transcript extraction microservice
│   └── search/                 # Query decomposition & planning microservice
├── ui/                         # React 18 + Vite responsive workstation
│   ├── src/components/chat/    # ChatStudio, MessageBubble, PromptBar
│   ├── src/components/sources/ # SourceList, SourceCard, SourceInspector
│   ├── src/components/study/   # AudioOverview, QuizView, MindMapView
│   └── src/pages/              # NotebookPage, SettingsPage, HomePage
├── docker-compose.yml          # Unified container orchestration
├── Dockerfile                  # Multi-stage production container
└── run.sh                      # Local developer supervisor
```

---

## 🔒 Security & Privacy

- **No Data Telemetry**: Your queries, documents, and notes never leave your self-hosted instance.
- **Zero Committed Secrets**: All credentials remain strictly within local `.env` or SQLite storage.
- **Anti-Hallucination Grounding**: Responses strictly cite context numbers `[1]`, `[2]`, traceable to source snippets.

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
