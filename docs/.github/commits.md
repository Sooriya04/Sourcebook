## Commit 1: Establish SourceBook V2 Backend Architecture, Integrate SearXNG–Searqon Pipeline, and Add Job Lifecycle Tracking
- Establish SourceBook V2 as an Internet Knowledge Engine.
- Integrate SearXNG for search discovery and Searqon for batch content scraping.
- Add configurable Searqon scrape endpoint.
- Implement in-memory ingestion pipeline with job management.
- Track job lifecycle (pending, running, succeeded, failed).
- Deduplicate sources using normalized URLs.
- Store pipeline responses and generate documents/chunks for indexing.
- Add job status endpoint (/api/sourcebook/v1/jobs/{job_id}).
- Update README and AGENTS documentation to reflect the new V2 architecture and roadmap.

## Commit 2: Implement LLM RAG Synthesis Engine, Modularize Handlers, and Add Text Cleaning Pipeline
- Modularize API package into strictly focused handler files (<200 lines per file: `api.go`, `search_handler.go`, `pipeline_handler.go`, `chat_handler.go`, `job_handler.go`).
- Build text cleaning utility (`internal/utils/cleaner.go`) to strip redundant carriage returns, whitespace bloat, and excessive linebreaks from scraped web sources.
- Create unified LLM client (`internal/llm/`) supporting local Ollama (`gemma2`) and OpenAI-compatible providers.
- Implement grounded RAG prompt builder (`internal/llm/prompt.go`) enforcing inline numerical citations (`[1]`, `[2]`) based strictly on retrieved search context.
- Implement RAG Synthesis Engine (`internal/synthesis/synthesizer.go`) to orchestrate search discovery, content scraping, sanitization, and LLM reasoning.
- Add `POST /api/sourcebook/v1/chat` endpoint for end-to-end grounded Q&A.
- Add step-by-step terminal execution logging for pipeline observability.
- Update `AGENTS.md` to reflect modern modular structure, LLM environment variables, and new API routes.