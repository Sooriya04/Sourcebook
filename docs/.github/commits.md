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

## Commit 6: End-to-End Live Web Ingestion & Corporate UI Refinement

- **Live Search Integration**: Connected the frontend `SourceDiscovery.jsx` to the live `GET /search` API, replacing mock data with real internet results powered by SearXNG.
- **Direct-URL Scraping Pipeline**: Modified the `POST /pipeline` endpoint (`pipeline_handler.go`) to accept an explicit array of `urls`. This allows the pipeline to bypass the discovery phase and immediately dispatch user-selected URLs to the Searqon scraper.
- **Scraper Stability**: Increased the Searqon internal HTTP client timeout from 15 seconds to 45 seconds to guarantee reliable ingestion of multiple heavy documents (e.g., batch Arxiv PDFs).
- **Import Orchestration**: Built the import flow in `NotebookPage.jsx` to lock the UI with a non-intrusive scraping toast while the Go backend pulls and sanitizes the sources, directly injecting the cleaned markdown into the notebook sidebar upon success.
- **Robust JSON Validation**: Fortified the frontend pipeline response handler to explicitly validate `Array.isArray(response.data)` and throw graceful errors instead of crashing the UI when the backend pipeline is forcefully aborted by the user.
- **Strict UI Cleanups (Anti-Slop)**: Stripped out leftover "vibe code" (glowing borders, giant blue circles, glassmorphism, sparky hero icons, and gradient text) from `index.css`, `HomePage.jsx`, and `AppShell.jsx`. Fully restored the application to a pristine, minimalist, monochrome aesthetic matching the core corporate design system.

## Commit 7: Add YouTube Microservice for Transcript Extraction
- **FastAPI Microservice**: Created a standalone Python microservice in `services/youtube` using FastAPI and Uvicorn to handle YouTube video processing.
- **Transcript Extraction**: Integrated the `youtube-transcript-api` to fetch and extract full text transcripts and segment details from YouTube videos, Shorts, and shortened URLs.
- **REST Endpoints**: Added a `POST /youtube/transcript` endpoint that accepts a YouTube URL and returns the extracted transcript text in JSON format.
- **Health Check and Logging**: Implemented a `GET /health` endpoint for service monitoring and configured an automatic rolling logger in the `logs` directory.

## Commit 8: Add SourceBook Search Service Microservice
- **Search Service Microservice**: Created a standalone FastAPI microservice in `services/search` dedicated only to query planning and web search orchestration.
- **LLM Query Planning**: Added an Ollama-backed planner that accepts long user paragraphs or rough research ideas and converts them into a structured `SearchPlan` containing intent, objective, entities, keywords, and multiple executable SearXNG queries.
- **SearXNG Search Orchestration**: Implemented async SearXNG integration using `httpx`, executing planned search queries concurrently and deduplicating results by URL.
- **Focused API Contract**: Added `GET /api/sourcebook/v1/health`, `GET /api/sourcebook/v1/search?q=...`, and `POST /api/sourcebook/v1/search` endpoints. Search responses return the original query, generated plan, normalized result list, and result count.
- **Minimal Result Payloads**: Reduced search result output to only necessary client-facing fields: `title`, `url`, and `snippet`, removing noisy provider metadata such as engine names and scores from the API response.
- **Typed Configuration**: Added `.env` and Pydantic Settings support for service port, SearXNG URL/port, Ollama URL/port, model name, timeouts, planner query limits, and logging mode.
- **Production-Oriented Logging**: Added Loguru-based request logging with request IDs, method, path, status code, latency, planner summaries, SearXNG query completion logs, and optional JSON log serialization.
- **Error Handling and Validation**: Added centralized exception handling for expected planner/search provider failures, ORJSON responses, strict Pydantic v2 models, and compile-verified Python service modules.

## Commit 9: Premium Research Workstation UI Redesign

- **Complete Visual System Replacement**: Rebuilt `ui/src/index.css` around a deliberate research-workstation aesthetic using a warm dark canvas, editorial typography, tactile panels, sharp interaction states, and restrained amber accents.
- **Premium Typography Stack**: Replaced the generic Inter/JetBrains Mono pairing with `Newsreader`, `Sora`, and `IBM Plex Mono` to give SourceBook a more distinctive product identity across the home page, notebook workspace, chat, source cards, modals, and drawers.
- **Workspace Layout Refinement**: Upgraded the 3-panel notebook interface with denser but cleaner source cards, a stronger chat reading column, improved prompt bar hierarchy, polished notes/audio panel styling, and responsive behavior for tablet and mobile widths.
- **Home Dashboard Redesign**: Reworked the notebook landing page into a stronger editorial dashboard with a large SourceBook masthead, structured search field, upgraded notebook cards, and a more intentional create-new notebook affordance.
- **Anti-Slop Component Cleanup**: Removed sparkle icons, emoji warning text, placeholder source-discovery glyphs, and leftover unused imports/parameters from the frontend so the UI feels less generated and more product-grade.
- **Compatibility Token Aliases**: Added backward-compatible CSS variable aliases (`--text-main`, `--bg-card`, `--accent-primary`, etc.) so existing component-level icon styling continues to render correctly under the new design system.
- **Validation**: Verified the frontend with `npm run build` and `npm run lint`; both pass successfully. Vite still emits a non-blocking existing dynamic-import chunking warning for `sourcebookApi.js`.

## Commit 10: Implement SQLite Notebook CRUD, Add Searqon Discovery Proxying, and Resolve Sidebar Overflow
- **Backend SQLite CRUD Integration**: Implemented Go backend HTTP endpoints `HandleNotebooks` and `HandleNotebookDetail` (in `internal/api/notebook_handler.go`) to support full CRUD operations and robust atomic syncing of notebook sources and notes to the SQLite database.
- **Environment-based Searqon Configuration**: Addressed setup where Searqon is running on a different machine by declaring `SEARQON_URL=http://localhost:4001` in the `.env` configuration file, and refactored the Go discovery handler to strictly load it without hardcoded fallbacks.
- **Search Result Format Reconciliation**: Updated `SourceDiscovery.jsx` search result parsing to support both standard SearXNG and nested Searqon response payloads (`data.results || data.data.results`), fixing empty search lists.
- **Discovery Sidebar Layout & Redundancy Cleanup**: Fixed vertical layout clipping in `.sidebar` by adding `height: 100%; overflow: hidden;` and `position: relative` to prevent overflow. Removed the redundant discovery header, query searchbox, and description since the notebook header already provides them.
- **Go Server Route Registration**: Registered the new notebook routes in the Go server multiplexer and compiled the updated backend binary.

## Future TODOs (For Tomorrow's Session)
- **Frontend SQLite Integration**: Rewrite frontend hooks (`useNotebooks.js`, `useSources.js`) to load from and save to the new SQLite REST API endpoints rather than relying on browser `localStorage`.
- **Chat History & Persistence**: Wire the `/chat` route and `chat_messages` table to persist and load conversation histories per notebook workspace.
- **Unified Document Ingestion Syncing**: Integrate the document parser and YouTube transcript extractor so that all locally uploaded files persist directly into the SQLite database.
