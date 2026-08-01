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

## Commit 3: NotebookLM Parity UI Overhaul & Corporate Redesign
- **Frontend Architecture Rewrite**: Decomposed the monolithic React app into 37 strictly-focused component files across `pages/`, `components/`, `hooks/`, `services/`, and `utils/`.
- **3-Panel Workspace Setup**: Implemented the NotebookLM-style 3-panel layout, featuring a Sources sidebar, a Chat Studio center, and a Saved Notes right panel.
- **Client-Side File Ingestion**: Built `fileIngestor.js` to process PDFs, markdown, and plain text locally in the browser, eliminating the need for a Python microservice backend.
- **Client-Side Routing**: Added `react-router-dom` to support navigation between a Notebooks Grid Home Page (`/`) and dynamic Notebook Workspaces (`/notebook/:id`).
- **Premium Corporate Design System (`index.css`)**: Removed vibrant gradients, glowing shadows, and playful neon accents in favor of a utilitarian, high-contrast corporate SaaS aesthetic (monochrome deep charcoal/slate with subtle blue accents and sharp borders).
- **Stitch MCP Integration Ready**: Configured `mcp_config.json` with the `@_davideast/stitch-mcp` package to enable AI-driven design-to-code capabilities directly within the workspace.

## Commit 4: UI Layout Parity & Bug Fixes
- **Exact "Add Source" Modal Stack**: Perfectly replicated the NotebookLM add source modal (`AddSourceModal.jsx`), featuring a "Find sources from the web" input on top and a sleek vertical button stack for uploading documents (PDF, Audio, YouTube, Drive, etc).
- **Interactive Source Discovery Flow**: Built a dynamic `SourceDiscovery.jsx` panel that replaces the left sidebar when searching the web. It displays search results with checkboxes (max 10 limit) and an Import button to automatically add selected sites to the notebook (currently using mock data).
- **Homepage Cleanup**: Fixed a critical prop-drilling bug (`createNotebook` vs `onCreateNotebook`) that broke notebook creation. Removed the "Featured notebooks" image cards to perfectly align with a minimal recent-only dashboard layout, and removed "Gemini Notebook" text to re-establish the "SourceBook" branding.

## Commit 5: Architectural Documentation Refactoring
- **Structured Documentation Hub**: Organized `docs/` into a modular, highly cohesive documentation structure with an index hub (`docs/index.md`).
- **Dedicated Diagram Files**: Created specific markdown documents for every major system component and pipeline (e.g., `master_architecture.md`, `search_scrape_pipeline.md`, `agentic_rag_flow.md`), directly embedding the corresponding visual graphs and diagrams.