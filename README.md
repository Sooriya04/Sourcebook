# SourceBook

SourceBook is an **Open-Source, Local-First NotebookLM + Perplexity Hybrid** built in Go.

It serves as a unified intelligence platform designed to aggregate heterogeneous web information, extract clean markdown, persist local knowledge, and feed a grounded LLM synthesis pipeline for AI-powered reasoning with strict numerical citations (`[1]`, `[2]`).

---

## ✨ Core Features

- **Resilient Search Orchestration:** A unified controller that queries multiple providers (SearXNG, DuckDuckGo HTML) concurrently with smart failover strategies.
- **Heterogeneous Content Ingestion:** Automated scraping and sanitization of web articles, local documents, and YouTube transcripts.
- **Grounded RAG Synthesis:** Context-optimized RAG prompts that use inline citations to prevent LLM hallucination and ensure factual traceability.
- **Local-First Architecture:** SQLite storage and lightweight microservices designed for low-latency, fully private local operations.

---

## 🗺️ System Architecture

SourceBook is structured into modular decoupled layers:
- **Presentation:** A responsive React workspace featuring a notebook panel, chat studio, and source inspector.
- **Routing & Controllers:** Go net/http router orchestrating concurrency, timeouts, and result normalization.
- **Microservices:** A Python service cluster for query planning (Ollama) and high-fidelity YouTube transcript extraction.
- **Registry & Providers:** Extensible registry coordinating primary web, media, and fallback search discovery.

---

## 📖 Documentation

For setup instructions, tech stack details, configurations, and API references, refer to:

- **Developer Guide & Context:** [AGENTS.md](AGENTS.md)
- **Layer Architecture Graph:** [docs/hierarchical_architecture.md](docs/hierarchical_architecture.md)
- **Commit History & Changelog:** [docs/.github/commits.md](docs/.github/commits.md)
