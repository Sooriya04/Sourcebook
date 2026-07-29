# SourceBook - Agent Context

This file is for AI coding agents working on SourceBook. It defines the project shape, priorities, and conventions.

---

## What is SourceBook?

SourceBook is an Internet Knowledge Engine, not just a search application.

It aggregates knowledge from multiple internet sources, normalizes the outputs, ranks them, and feeds a shared knowledge pipeline for AI-powered reasoning. The long-term direction is a NotebookLM-style backend built around unified retrieval, preprocessing, and grounded answers.

---

## Vision

SourceBook is designed to:

- query multiple providers simultaneously
- normalize heterogeneous results into one schema
- rank and deduplicate results consistently
- ingest web content into a knowledge pipeline
- support citation-aware retrieval and analysis later

The current focus is backend-first: search, ingestion, preprocessing, storage, and retrieval infrastructure.

---

## Core Principles

1. Provider-agnostic
2. Modular
3. Concurrent
4. Extensible
5. Lightweight
6. Built in Go
7. Containerized with Podman
8. Memory efficient
9. Production-ready

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Go |
| HTTP Server | `net/http` |
| Config | `.env` via `godotenv` |
| Search | SearXNG via HTML scraping |
| Scraping / preprocessing | Searqon |
| Runtime | Podman / Docker |

---

## Current Architecture

```text
Query API
  ->
Unified Search Controller
  ->
Provider Registry
  ->
Unified Result Normalizer
  ->
Search Ranking
  ->
Knowledge Pipeline
  ->
Knowledge Base
```

The current implementation already includes:

- SearXNG search provider
- unified search controller
- pipeline endpoint
- in-memory pipeline store
- job tracking
- source deduplication
- raw pipeline response capture
- document and chunk extraction from pipeline output where possible

---

## Project Structure

```text
sourcebook/
├── cmd/server/main.go
├── internal/
│   ├── api/handlers.go
│   ├── controller/search.go
│   ├── models/
│   ├── pipeline/
│   ├── providers/
│   │   └── searx/client.go
│   └── registry/registry.go
├── README.md
└── AGENTS.md
```

---

## Search Model

SourceBook’s shared search options:

```go
type SearchOptions struct {
    Web bool
    Images bool
    Videos bool
    News bool
    PDFs bool
    Docs bool
    MaxResults int
    Language string
    SafeSearch bool
}
```

Every provider returns normalized results through the shared `SearchResult` schema.

---

## Provider Interface

Every provider must implement the same interface:

```go
type SearchProvider interface {
    Name() string
    Search(ctx context.Context, query string, options SearchOptions) ([]SearchResult, error)
}
```

Adding a new provider should require only:

1. implementing the interface
2. registering the provider in `cmd/server/main.go`

---

## Unified Search Controller

`Search(ctx, query, options)` is the main coordination point.

Responsibilities:

- validate request input
- dispatch providers concurrently
- apply per-provider timeouts
- collect results
- merge and deduplicate
- return unified output

Failures from one provider should not stop the overall search.

---

## SearXNG

SearXNG is the primary backend search source.

It is used for:

- Web search
- Image search
- News search
- Video search

The provider uses HTML scraping and normalizes the result into the shared schema.

---

## Knowledge Pipeline

The current pipeline is the backend spine for future notebook-style behavior.

Flow:

1. Search SearXNG for URLs
2. Deduplicate and select top results
3. Send URLs to Searqon `/scrape/batch`
4. Store the job and pipeline output
5. Extract documents and chunks from returned content where possible

The pipeline store currently tracks:

- jobs
- sources
- documents
- chunks

This is intentionally the first step toward durable persistence, retrieval, embeddings, and citation mapping.

---

## API Endpoints

All endpoints are versioned under `/api/sourcebook/v1/`.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/sourcebook/v1/search?q=...` | Search via SearXNG |
| POST | `/api/sourcebook/v1/search` | Search via JSON body |
| POST | `/api/sourcebook/v1/pipeline` | Search -> scrape/batch -> store |
| GET | `/api/sourcebook/v1/jobs/{job_id}` | Inspect pipeline job state |
| GET | `/health` | Health check |

---

## Environment Variables

```env
SEARXNG_URL=http://localhost:8080
SEARQON_SCRAPE_URL=http://127.0.0.1:4001/scrape/batch
PORT=5000
```

Never hardcode IPs or ports when a config value exists.

---

## Roadmap Direction

### Phase 1

- SearXNG integration
- unified search controller
- result normalization
- basic ranking
- REST API

### Phase 2

- Wikipedia, GitHub, Reddit, Stack Overflow, RSS providers
- HTML and PDF ingestion
- metadata extraction
- local knowledge base

### Phase 3

- Agentic RAG
- hybrid retrieval with BM25 and vectors
- semantic reranking
- AI chat over indexed content

### Phase 4

- knowledge graph
- cross-source relationship discovery
- personalized collections and workspaces
- browser extension
- live monitoring and scheduled indexing
