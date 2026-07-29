# SourceBook

SourceBook is an Internet Knowledge Engine, not just a search application.

It aggregates knowledge from multiple internet sources, normalizes the outputs, ranks them, and feeds a shared knowledge pipeline for AI-powered reasoning. The long-term direction is a NotebookLM-style backend built around unified retrieval, preprocessing, and grounded answers.

## Vision

SourceBook is designed to:

- query multiple providers simultaneously
- normalize heterogeneous results into one schema
- rank and deduplicate results consistently
- ingest web content into a knowledge pipeline
- support citation-aware retrieval and analysis later

The current focus is backend-first: search, ingestion, preprocessing, storage, and retrieval infrastructure. The frontend and product UX can come later.

## High-Level Architecture

```text
User
  ->
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
  ->
Agentic RAG
  ->
Chat / Search / Analysis
```

## Core Principles

- Provider-agnostic
- Modular
- Concurrent
- Extensible
- Lightweight
- Built in Go
- Containerized with Podman
- Memory efficient
- Production-ready

## Project Structure

```text
sourcebook/
cmd/
    server/
internal/
    api/
    controller/
    providers/
        searx/
            web.go
            images.go
            news.go
            videos.go
        wikipedia/
        github/
        reddit/
        stackoverflow/
        rss/
    registry/
    models/
    ranking/
    parser/
        html/
        pdf/
        markdown/
    ingestion/
    rag/
    embeddings/
    vectordb/
    cache/
    middleware/
pkg/
configs/
deployments/
docker/
tests/
```

## Unified Search Controller

The Unified Search Controller coordinates all providers through a single search entry point:

`Search(ctx, query, options)`

Responsibilities:

- validate request input
- dispatch providers concurrently
- handle timeouts and cancellation
- retry where appropriate
- merge results
- deduplicate results
- rank results
- return unified output

## Search Options

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

## Provider Interface

Every provider implements the same interface:

```go
type SearchProvider interface {
    Name() string
    Search(ctx context.Context, query string, options SearchOptions) ([]SearchResult, error)
}
```

Adding a provider should only require implementing this interface and registering it.

## Provider Registry

The registry is responsible for provider discovery and execution coordination.

Example providers:

- SearXNG
- Wikipedia
- GitHub
- Reddit
- Stack Overflow
- RSS
- Custom providers

## SearXNG

SearXNG is the primary backend provider.

It is used for:

- Web search
- Image search
- News search
- Video search

SearXNG results are parsed through HTML scraping, and the result set is normalized into SourceBook’s common schema.

## Unified Search Result

All providers normalize into a shared `SearchResult` structure:

- ID
- Title
- URL
- Snippet
- ImageURL
- Thumbnail
- Source
- Author
- PublishedAt
- Language
- Category
- Score
- Metadata

This keeps the rest of the system independent from provider-specific response formats.

## Concurrent Search

Search requests are dispatched concurrently.

Flow:

```text
Search
  ->
spawn provider workers
  ->
collect results
  ->
merge
  ->
rank
  ->
return
```

Each provider uses its own timeout, and failures should not break the entire query.

## Ranking Pipeline

Results can pass through:

- Deduplication
- Source quality
- Freshness
- Keyword similarity
- Semantic similarity
- Popularity
- Final scoring

## Caching

SourceBook should support either:

- Redis
- In-memory TTL cache

Cache keys should be derived from:

- query
- search options

The intent is to reduce repeated upstream requests and keep the system responsive.

## Knowledge Pipeline

Search results can be turned into structured knowledge through:

```text
Search Result
  ->
Fetch Page
  ->
Extract Metadata
  ->
Clean HTML
  ->
Chunk
  ->
Embed
  ->
Store
```

This pipeline is the foundation for later knowledge-base and RAG features.

## Agentic RAG

SourceBook is expected to support:

- semantic search
- citation-aware answers
- multi-source reasoning
- follow-up questions
- document grounding

## Future Knowledge Graph

Later phases can extract entities such as:

- People
- Organizations
- Technologies
- Companies
- Repositories
- Concepts

And relationships between them for graph storage and traversal.

## API Surface

Current and planned backend-oriented endpoints:

- `POST /search`
- `POST /search/images`
- `POST /search/news`
- `POST /search/videos`
- `POST /knowledge/ingest`
- `POST /chat`
- `GET /providers`
- `GET /health`

## Configuration

Environment-driven configuration is preferred.

Expected variables:

- `SEARXNG_URL`
- `REQUEST_TIMEOUT`
- `MAX_RESULTS`
- `CACHE_TTL`
- `DEFAULT_LANGUAGE`
- `ENABLE_IMAGES`
- `ENABLE_NEWS`
- `ENABLE_VIDEOS`

## Design Goals

- Clean Architecture
- SOLID principles
- Dependency Injection
- Interfaces over implementations
- Concurrent execution
- Easy provider extensibility
- Production logging
- Metrics
- Graceful shutdown
- Unit and integration tests

## Long-Term Roadmap

### Phase 1

- SearXNG integration for web, images, news, and videos
- Unified Search Controller
- Result normalization
- Basic ranking
- REST API

### Phase 2

- Wikipedia, GitHub, Reddit, Stack Overflow, and RSS providers
- HTML and PDF ingestion
- Metadata extraction
- Local knowledge base

### Phase 3

- Agentic RAG
- Hybrid retrieval with BM25 and vectors
- Semantic reranking
- AI chat over indexed content

### Phase 4

- Knowledge graph
- Cross-source relationship discovery
- Personalized collections and workspaces
- Browser extension
- Live monitoring and scheduled indexing

SourceBook’s core idea is simple: a unified controller orchestrates specialized providers, normalizes their outputs into a common schema, and feeds a shared knowledge pipeline that can grow into a full reasoning system.
