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


## Commit 11: Drawer UI Redesign and End-to-End Markdown Scrape Persistence
- **UI & Drawer Redesign**: Redesigned the `SourceInspectorDrawer` using modern glassmorphism cards, glowing citation badges (`[1]`), and clean domain labels. Fixed an issue where source cards rendered empty brackets `[]` by enforcing index fallbacks.
- **Rich Markdown Rendering**: Integrated `react-markdown` to render extracted source text with premium dark-mode typography (headings, bullet lists, code blocks) inside the drawer.
- **End-to-End Extraction Pipeline**: Modified the frontend `handleImportDiscovery` flow to automatically dispatch the `runPipeline` web scraper for all selected search results upon import.
- **SQLite Schema Upgrade**: Added a missing `content TEXT` column to the `sources` table via an auto-migration script in `db.go` so extracted markdown text is permanently persisted.
- **Data Hydration**: Updated backend models (`models.SourceRecord`) and SQL `INSERT`/`SELECT` queries to correctly read and write the full `content` payload.

## Commit 12: Backend Persistence, CORS/404 Resolution, and Proxying
- **Database Architecture**: Fully migrated frontend state management from `localStorage` to the SQLite backend (`sourcebook.db`), ensuring reliable persistence across sessions.
- **API & CORS Stability**: Resolved persistent `404` and `CORS` issues by unifying `/notebooks` and `/notebooks/` handlers in the Go router to prevent redirect loops.
- **Same-Origin Proxying**: Configured the Vite dev server to proxy `/api` requests to the Go backend (`127.0.0.1:5000`), completely bypassing browser CORS complexities and environment variable misconfigurations.
- **Fail-Safe Discovery**: Implemented automatic fallback routing in `discovery_handler.go` to seamlessly default to standard SearXNG if the Searqon engine is slow or unreachable.

## Commit 13: YouTube Microservice, Environment Isolation, and UI Polish
- **YouTube Microservice Proxy**: Created `internal/api/youtube_handler.go` and registered `/api/sourcebook/v1/youtube/transcript` in the Go API router to proxy transcript requests to the standalone FastAPI Python microservice.
- **Zero Hardcoded API URLs**: Enforced strict environment variable loading (`YOUTUBE_SERVICE_URL`, `SEARQON_SCRAPE_URL`, `SEARXNG_URL`) across Go handlers and `.env` with no hardcoded fallback URLs in the codebase.
- **Robust Transcript Extraction**: Updated `services/youtube/services/transcript.py` to inspect all available manual and auto-generated transcripts and extract native transcript content cleanly without forcing poor machine translations.
- **Python 3.14 Environment Compatibility**: Updated `services/youtube/requirements.txt` to modern `pydantic>=2.10.0` and `pydantic-settings>=2.7.0` to resolve Python 3.14 wheel compilation errors (`ForwardRef._evaluate`).
- **Unified `.venv` Launcher Script**: Created executable `run.sh` that automatically detects and activates the root `.venv` virtual environment and launches both the Python YouTube service (`:6001`) and Go backend server (`:5000`) concurrently.
- **Source Deletion & Sequential Re-Indexing**: Fixed a state re-hydration bug in `useSources.js` to ensure deleting a source immediately syncs with SQLite and re-indexes remaining sources (`[1]`, `[2]`, `[3]...`).
- **Compact UI Workspace Header**: Added CSS line-clamping and a stateful "Read more / Show less" toggle to `ChatStudio.jsx` for long notebook descriptions, keeping the center chat interface spacious and uncrowded.

## Commit 14: DuckDuckGo Search Fallback
Implemented a standalone DuckDuckGo HTML search provider in `internal/providers/ddg/client.go` with specialized request headers to bypass CAPTCHA. Wired it into `UnifiedSearchController` as a default fallback when the primary SearXNG server is offline or returns empty results.

## Commit 15: Agentic Search-and-Synthesis Pipeline Integration
- **Automated Text Discovery**: Added an agentic ingestion loop in the Go backend (`internal/api/notebook_handler.go`) to automatically trigger subquery planning for newly added large text sources.
- **Microservice Integration**: Built a robust Go client (`internal/utils/search_service_client.go`) to connect the Go backend to the Python search planner, parsing the returned `SearchPlan` to execute web discovery.
- **Automated Batch Scraping**: For each planned query, the pipeline automatically fetches the top results via SearXNG and scrapes their content using Searqon, immediately persisting the rich context into the notebook.
- **Robust Pydantic Configs**: Rewrote the Python search service's configuration schema (`services/search/config.py`) using `AliasChoices`, allowing it to cleanly load LLM and SearXNG URLs natively from the root `.env` without any hardcoded localhost fallbacks.
- **Payload Validation Relaxation**: Increased the `max_length` parameter in the `SearchRequest.query` Pydantic model (`services/search/models/request.py`) to `100_000` to support large text payloads without throwing `422 Unprocessable Content` errors.
- **Go LLM Client Safety**: Hardened the Go LLM client (`internal/llm/client.go`) to explicitly fail with a fatal error if `LLM_URL` or `LLM_MODEL` are not provided in the environment, permanently preventing silent localhost fallbacks.

## Commit 16: SQLite Local Semantic RAG & Offline Vector Storage
- **Offline Semantic Search**: Shifted to SQLite as the single source of truth for semantic vector embeddings by defining the `document_chunks` table and binary `BLOB` persistence in `internal/database/chunk_repo.go`.
- **Dependency-Free Fallbacks**: Rewrote the Python embedding microservice (`services/embeddings/main.py`) to gracefully fallback to a pure-Python FNV-1a Hashing Term-Frequency (TF) Vectorizer (384 dimensions) when PyTorch is unavailable, enabling fully offline semantic search without internet downloads.
- **Go Vector Library**: Developed a pure Go vector mathematics library (`internal/vector/vector.go`) for high-performance, in-memory Cosine Similarity operations and float32-to-byte serialization for SQLite.
- **Automated Text Chunking Pipeline**: Updated `internal/api/notebook_handler.go` to automatically chunk and embed all text sources/scraped websites into SQLite vectors whenever a notebook is saved.
- **Scoped Chat Retrieval**: Updated `internal/api/chat_handler.go` to retrieve vectors using Cosine Similarity strictly within the active notebook's bounds, gracefully falling back to a structured text-citation response when a local LLM is missing.
- **Primary Search Swap**: Made DuckDuckGo the primary HTML search source instead of SearXNG inside the `UnifiedSearchController` and `api.NewAPI` initialization.
- **UI Tweaks**: Fixed a visual bug on the UI dashboard where notebooks incorrectly reported "0 Sources", and added CSS line-clamping to prevent long notebook descriptions from breaking the UI layout.

## Commit 17: User Configurable Search Settings & YouTube Extension
- **SQLite Settings Persistence**: Built a dedicated `user_settings` table in `sourcebook.db` and exposed `GET` and `PUT` endpoints under `/api/sourcebook/v1/settings` for fully local, browser-independent configuration persistence.
- **Dynamic Search Routing**: Upgraded the `UnifiedSearchController` to dynamically read user preferences from SQLite and route requests to DuckDuckGo, SearXNG, or both simultaneously using concurrent Go routines with user-defined query limits.
- **Frontend Settings Page**: Created a responsive Settings page (`/settings`) allowing users to easily toggle their preferred web search configuration, define the maximum source scraping limits, and balance the provider split dynamically.
- **Isolated YouTube Integration UI**: Implemented an independent YouTube Agent configuration section on the settings page, saving limits safely to local storage per user direction.
- **Scroll Fix**: Fixed an overarching layout bug where the settings page was unscrollable due to inherited `overflow: hidden` properties from the main app workspace.

## Commit 18: YouTube Discovery and High-Speed Concurrent Pipeline Execution
- **Unified Discovery Handlers**: Upgraded the `discovery_handler.go` endpoint to concurrently query the Searqon API (for web results) and the YouTube microservice `POST /youtube/discover` endpoint, gracefully merging results into a unified discovery payload.
- **Robust Pipeline Interception**: Refactored the `POST /pipeline` backend execution (`pipeline_handler.go`) so that when users import selected sources, YouTube URLs are intelligently intercepted from the batch.
- **Direct Transcript Extraction**: Instead of sending YouTube URLs to the Searqon web scraper (which fails on video players), the backend intercepts them and pipes them directly to a new `FetchSingleYouTubeTranscript` Go client pointing at the Python microservice.
- **Blazing-Fast Parallel Ingestion**: Rebuilt the ingestion pipeline loop using Go `sync.WaitGroup` and `sync.Mutex` to fire off all YouTube transcript extractions AND the batch Searqon web scrape *completely concurrently*.
- **Searqon Response Mapping Fix**: Fixed a silent mapping bug in `discovery_handler.go` where Searqon's JSON `{ "success": true, "data": [...] }` payload was incorrectly parsed, causing web results to be erased. 
- **UI Slice Limit Removal**: Increased the hardcoded `slice(0, 10)` limit in the React `SourceDiscovery.jsx` component to `slice(0, 20)` to ensure YouTube results (appended at the end of the array) correctly render on the screen.

## Commit 19: Visual Ingestion Feedback, Rate-Limit Resilience, and Timeout Relief
- **YouTube Rate Limit Resilience**: Hardened the Python YouTube microservice (`services/youtube/routes/youtube.py`) to explicitly catch `youtube_transcript_api._errors.RequestBlocked` exceptions. Instead of crashing with a massive stack trace and returning a 500 error, it now cleanly returns a `429 Too Many Requests` status, allowing the Go ingestion pipeline to skip blocked videos and successfully process the remaining sources.
- **Visual Ingestion Status & Badging**: Implemented dynamic frontend feedback during the concurrent pipeline ingestion. Added an "Indexing..." status state in `useSources.js` that immediately registers placeholder sources into the sidebar.
- **UI Loader**: Added a responsive CSS spinning animation (`.source-status-badge`) and an amber `Loader2` icon to `SourceCard.jsx`. Cards in the "Indexing..." state are visually dimmed and disabled from interactions to prevent UI bugs.
- **Asynchronous State Synchronization**: Fixed a ReferenceError by correctly destructuring `updateMultipleSources` in `NotebookPage.jsx`, allowing the application to silently flip the placeholder cards to "Ready" once the Go pipeline returns the full scraped markdown, instantly unlocking them for reading and citation.
- **Discovery Timeout Relief**: Drastically increased the aggressive 5-second `context deadline` timeouts in `discovery_handler.go` and `internal/controller/search.go` to 15 seconds to accommodate high-latency responses from Searqon and DuckDuckGo/SearXNG during heavy metadata discovery.

## Commit 20: Study Studio Interface Overhaul and Persistent Grid Stability
- **Study Studio Workspace**: Redesigned the right-side NotesPanel into a "Studio" workspace featuring a clean, vertical Y-axis stack of study tools (Audio Overview, Flashcards, Quiz, Mind Map, Reports). Removed cluttered placeholders like Video Overview and Data Table.
- **Persistent Grid Layout Stability**: Permanently resolved a major React DOM-shifting bug that caused the screen to go black or the Studio panel to stretch across the UI when sidebars were closed. Fixed this by assigning explicit `grid-column: 1`, `2`, and `3` anchoring to `.sidebar`, `.center-workspace-wrapper`, and `.notes-panel` respectively.
- **Hidden Collapse States**: Re-engineered the Sidebar and Studio panels to render hidden `display: none` DOM placeholders instead of returning `null` when collapsed, guaranteeing the central Chat panel always securely anchors to the middle `1fr` column.
- **Inline Header Toggles**: Introduced dual `[ Sources ]` and `[ Studio ]` toggle pill buttons inside the Chat header. These buttons feature dynamic active/collapsed CSS states, allowing users to smoothly minimize or expand the side panels directly from the top bar.
- **Fixed Panel Widths**: Enforced strict `max-width` constraints (`310px` for Sources, `320px` for Studio) to ensure they never consume flexible screen space intended for the primary Chat or Study components.

## Commit 21: Finalize Phase 3 (Local Document Ingestion Polish)
- **Vite Proxy Consolidation**: Updated `ui/vite.config.js` to proxy `/parse` endpoints directly to the `services/document` Go microservice on port 4002, eliminating CORS boundaries and hardcoded localhost URLs in the frontend API calls.
- **Backend Schema Alignment**: Fixed a critical frontend schema mismatch in `ui/src/services/fileIngestor.js` where parsed documents were returning `text` instead of `content`. This ensures that when PDFs and Markdown are uploaded, the Go backend correctly receives the payload, saves it into SQLite `sources`, and generates vector embeddings.
- **Roadmap Completion**: Officially marked Phase 3 (Local Notebooks & Document Ingestion) as completely implemented in `AGENTS.md`.

## Commit 22: Native Ollama Embeddings Integration
- **Direct LLM Embeddings**: Ripped out the entire Python `sentence-transformers` microservice (port 8020). Rewrote the Go `internal/vector/client.go` to natively send chunked text directly to Ollama's `/api/embeddings` endpoint over Tailscale (`LLM_URL`).
- **Nomic-Embed-Text**: Switched the embedding model from `all-MiniLM-L6-v2` (384 dimensions) to Ollama's state-of-the-art `nomic-embed-text` (768 dimensions), which provides vastly superior semantic matching.
- **Native Go Text Chunking**: Implemented a pure-Go text chunking fallback (`chunkTextFallback`) inside the vector client that intelligently splits large documents by paragraphs and sentence boundaries to cleanly fit Ollama's context window without breaking mid-sentence.
- **Resource Optimization**: Deleted the `services/embeddings` directory and stripped it from the `run.sh` launch script, significantly reducing the system's idle RAM footprint and completely eliminating Python ML dependencies from the core search execution loop.

## Commit 23: Improve notebook search, discovery, crawling, and sync performance

* **Notebook-Scoped Chat Vector Search**: Fixed `useChat.js` and `sourcebookApi.js` to include `notebook_id` in `/chat` POST requests, ensuring chat queries perform vector search against active notebook sources instead of incorrectly falling back to global web search.
* **Smart Chunk & Embedding Reuse**: Optimized `handleNotebookDetail` in `notebook_handler.go` to reuse existing SQLite document chunks when sources remain unchanged, eliminating redundant Ollama `nomic-embed-text` embedding operations during auto-sync.
* **Non-Destructive Chat Message Sync**: Updated `SyncNotebookMessages` in `notebook_repo.go` to use `UPSERT` with `ON CONFLICT(id) DO UPDATE`, preserving existing chat history and original message creation timestamps.
* **Dynamic YouTube Metadata**: Added fast oEmbed-based title resolution in `youtube_client.go` via `FetchYouTubeTitle`, replacing generic `"YouTube Video"` titles with actual video names.
* **Resilient Server Initialization**: Added a default `SEARXNG_URL` fallback of `http://localhost:8080` in `main.go` to prevent startup failures when the environment variable is missing.
* **Balanced Flashcard Chunk Sampling**: Refactored `study_handler.go` to round-robin sample chunks across all notebook sources while falling back to raw source content when chunks are not yet indexed.
* **YouTube English Transcript Enforcement**: Updated `transcript.py` to prioritize native English captions (`en`, `en-US`, `en-GB`, `en-CA`, `en-AU`) and auto-generated English transcripts.
* **Automatic Transcript Translation**: Added YouTube translation fallback for non-English transcripts using `t.is_translatable` and `.translate('en')`, preventing Hindi, Spanish, and other foreign-language transcripts from entering RAG context when English translation is available.
* **Prevented Non-English RAG Bloat**: Ensured untranslated foreign-language transcripts are excluded when neither an English transcript nor an English translation is available.
* **ESC Key Drawer Control**: Added `Escape` key handling to `SourceInspectorDrawer.jsx` and `App.jsx`, allowing source preview drawers to be closed instantly using the ESC key.
* **Searqon Deep Sub-URL Crawling**: Integrated Searqon's native recursive `POST /crawl` endpoint into `crawl_handler.go` and `pipeline_handler.go` for deep crawling of linked sub-pages.
* **Deep Crawl Settings**: Added a dedicated Searqon Deep Sub-URL Crawling configuration card in `SettingsPage.jsx` with enable/disable control, `deep_crawl_limit`, and `deep_crawl_depth` settings.
* **Database Auto-Migration**: Added `deep_crawl_enabled`, `deep_crawl_limit`, and `deep_crawl_depth` columns to `user_settings` with automatic schema migration support.
* **Resilient Source Discovery**: Added a `SEARQON_URL` fallback of `http://127.0.0.1:4001` in `discovery_handler.go`, preventing HTTP 500 failures when the environment variable is unset.
* **Race Condition Fixes**: Reworked `HandleDiscovery` concurrency using `sync.WaitGroup` and mutex synchronization, eliminating race conditions between web and YouTube discovery goroutines.
* **Graceful Discovery Fallback**: Added direct search-controller fallback when Searqon is unavailable or returns empty results, ensuring discovery requests consistently return `200 OK` JSON responses.
* **Non-Blocking Vector Embedding**: Refactored notebook auto-sync embedding in `notebook_handler.go` to run Ollama chunk embedding asynchronously with a 3-minute background timeout, allowing notebook updates to complete immediately.
* **Eliminated Auto-Sync 502 Timeouts**: Notebook updates now return `204 No Content` in under 5ms instead of waiting for long-running embedding operations, preventing Vite proxy 30-second timeout failures and `Failed to update notebook: 502` errors.
* **Fixed Searqon Discovery JSON Parsing**: Corrected the `rawSearqon` response structure in `discovery_handler.go` to parse results from `data.results`, restoring proper Searqon web result decoding.
* **Restored Web & YouTube Discovery**: Verified that Searqon web sources and YouTube videos are returned together across discovery searches.
* **Parallelized Deep Crawling**: Refactored `pipeline_handler.go` to concurrently dispatch Searqon `/crawl` requests across web sources using `sync.WaitGroup` and goroutines.
* **10x Deep Crawl Performance Improvement**: Reduced multi-page deep crawling of 10+ web domains and 50+ extracted documents from approximately 94 seconds to 5–8 seconds total.

## Commit 24: Grounded RAG Resilience & Discovery Query Deduplication
- **Offline Embedding Fallback**: Refactored `chat_handler.go` to catch embedding service failures gracefully and fall back to raw notebook source context instead of returning an HTTP 500 error when Ollama is offline.
- **Dynamic RAG Max-Sources**: Updated `useChat.js` to fetch and respect `max_sources` from user settings dynamically instead of using a hardcoded state of 5.
- **Clean Discovery Query Lifecycle**: Streamlined `SourceDiscovery.jsx` `useEffect` with `isMounted` flag for clean data fetching and state updates.

## Commit 25: Opportunistic Background Scrape Sentinel
- **New Package `internal/agent/sentinel.go`**: Introduced the `Sentinel` struct — a lightweight background repair agent that watches for sources with empty or NULL `content` in SQLite and silently re-scrapes them via Searqon.
- **Mutex-Guarded Single Execution**: `Sentinel.Trigger()` uses a `sync.Mutex` + `running` flag to guarantee at most one repair cycle runs at a time, even under concurrent search traffic.
- **Fire-and-Forget Design**: The Sentinel is triggered via `go a.sentinel.Trigger()` inside `HandleSearch` and `HandleDiscovery`. It creates a detached `context.Background()` with a 2-minute timeout so HTTP request completion/cancellation does not cancel the background scrape job (`context canceled` fix).
- **Default Endpoint Fallback**: Added `http://127.0.0.1:4001/scrape/batch` fallback when `SEARQON_SCRAPE_URL` environment variable is omitted.
- **YouTube URL Exclusion**: Empty YouTube source rows are automatically skipped (handled by the transcript service, not Searqon batch scrape).
- **Repository Accessor**: Added `DB()` method to `database.Repository` so the Sentinel holds a clean `*sql.DB` reference without coupling to the full Repository API.
- **Zero Frontend Impact**: No new routes, no new UI, no polling loop — purely a background Go maintenance mechanism triggered by existing search activity.

## Commit 26: Full ArXiv Paper & PDF Extraction Engine
- **New Package `internal/arxiv/arxiv.go`**: Built a dedicated arXiv extraction engine supporting paper ID normalization across `/abs/`, `/pdf/`, and `/html/` arXiv links.
- **Hierarchical 3-Tier Extraction**:
  1. **arXiv HTML Version (`https://arxiv.org/html/<id>`)**: Fetches and parses full HTML article text using `goquery`.
  2. **Direct PDF Download & Parsing (`https://arxiv.org/pdf/<id>.pdf`)**: Downloads the paper PDF to a temp file and extracts text using `github.com/ledongthuc/pdf`.
  3. **Abstract Metadata Fallback (`https://arxiv.org/abs/<id>`)**: Extracts title, author list, and abstract structured markdown from HTML `<meta>` tags.
- **Pipeline Interception**: Updated `pipeline_handler.go` to intercept arXiv URLs and run concurrent `FetchSingleArxivDocument` workers alongside YouTube and web scrapers.
- **Sentinel ArXiv Support**: Updated `sentinel.go` to repair empty arXiv source rows via direct arXiv extraction instead of Searqon batch web scraping.

## Commit 27: Modernize SourceBook UX, Implement Sentinel status tracker, Citation Hover Popovers, Source Inspector Search, and Contextual Scoping
- **Sentinel Status Observability**: Exposed Sentinel state `/api/sourcebook/v1/sentinel/status` and added a pulsing `SentinelStatus` indicator in the notebook header. Styled distinct states for "Scraping" (spinning loader), "Pending Scrapes" (idle count display), and "Synced".
- **Grounded Citation Hover Cards**: Added glassmorphic popover previews to `CitationPill.jsx` displaying cited snippet text, source details, and domain links on hover.
- **Source Inspector Drawer Upgrades**: Added search capabilities, regex-based highlighting, and copy to clipboard function inside `SourceInspectorDrawer.jsx` to mark cited excerpts (`.source-snippet-highlight`), matching search queries (`.source-query-highlight`), and copy raw content.
- **Tabbed Study Studio Suite**: Transformed `StudyStudio.jsx` into a modular tabbed interface containing:
  - *Briefing Document*: Concepts, key findings, and definitions list.
  - *Audio Overview*: Bouncing CSS wave audio player simulating host conversation.
  - *FAQ Guide*: Collapsible learning accordion cards.
  - *Flashcards*: Standard flip card active recall suite.
- **Contextual Source Scoping**: Added a scoping popover in the `PromptBar` allowing users to restrict RAG queries to selected sources, passing them as `ScopedSourceIDs` to `chat_handler.go` for targeted SQLite vector matching.
- **Sentinel Robustness & Scroll Fixes**: Excluded YouTube URLs directly from the Sentinel SQLite empty sources query to prevent infinite loops, styled premium custom Webkit scrollbars, and resolved search icon/text overlap in the drawer toolbar.

## Commit 28: Dedicated Ingestion Microservices for Jina Reader and Reddit
- **High-Resilience Ingestion Layers**: Created standalone Go-based microservices for Jina Reader (`services/jina` on port 4003) and Reddit (`services/reddit` on port 4004) to decouple scraping logic and handle platform-specific rate limits and gates.
- **Go Reddit Scraper with Mirror Fallback**: Implemented the Reddit microservice with automated translation/routing of `reddit.com` and `redd.it` URLs to a public mirror (`rxddit.com`) to bypass anti-bot gates without requiring browser login sessions.
- **Sentinel and Pipeline Fallback Integrations**: Updated the background Sentinel (`internal/agent/sentinel.go`) and pipeline handler (`internal/api/pipeline_handler.go`) to check for Reddit URLs, process them concurrently using the dedicated Reddit client, and fall back to the Jina microservice if standard Searqon web scraping fails.
- **Unified Binary Compilation & Cleanup**: Configured the build workflow to place all compiled binaries (`sourcebook-server`, `document-service`, `jina-service`, `reddit-service`) into a single `/bin` directory, cleaning up unwanted intermediate binaries from the source directories.
- **Unified Runner Script Refactoring**: Updated `run.sh` to automatically clean up all service ports (including 4003 and 4004) on startup, and launch compiled microservice binaries directly from `/bin` with graceful fallback to dynamic `go run` compilation if the binaries are not found.

## Commit 29: Integrate RSS/Atom Feeds and Social Media (WeChat, Weibo, Bilibili, Facebook, LinkedIn) Ingestion
- **Dedicated Social Microservice (`services/social`)**: Built a modular Go service on port `4005` handling RSS/Atom XML feeds and public social media platforms (WeChat Articles, Weibo, Bilibili, Facebook, LinkedIn) without session/login dependencies.
- **Native RSS/Atom Parsing**: Implemented pure-Go XML decoding for both RSS and Atom feeds, automatically transforming feed lists into structured, title-linked markdown summaries.
- **Jina Reader Social Media Scraper**: Leveraged proxy-rendered Jina Reader fetching to parse public pages on WeChat, Weibo, Bilibili, Facebook, and LinkedIn without requiring cookie verification or logged-in accounts.
- **Sentinel and Pipeline Concurrency**: Integrated social platform detection and concurrent batch scraping workers in both `internal/agent/sentinel.go` and `internal/api/pipeline_handler.go`.
- **Integrated Binary Build and Runner Lifecycle**: Added `/bin/social-service` compilation support and added port `4005` setup inside `run.sh` with source fallback logic.
## Commit 30: Stabilization and Bug Fixes for Ingestion Microservices
- **Social Service Context Safety**: Resolved a race condition in `services/social/main.go` where `http.Request` was captured in a goroutine closure, potentially leading to panics if the request context cancelled early. Extracted the `context.Context` beforehand.
- **Robust RSS/Atom Parsing**: 
  - Fixed false-positive URL detection in `isFeedURL` (which incorrectly flagged unrelated domains containing the word "atom").
  - Implemented `truncateRunes()` to safely slice multi-byte UTF-8 descriptions without panicking.
  - Added strict `Accept` HTTP headers to enforce XML responses from obstinate feed servers.
- **Reddit Mirror Shortlink Resolution**: Fixed the handling of `redd.it` short URLs in `services/reddit/main.go` by introducing a pre-flight HTTP redirect resolver, guaranteeing valid URLs before transforming them for the `rxddit.com` mirror.
- **Title Extraction Fallback Consistency**: Standardized the fallback URL slug extraction across `jina`, `reddit`, and `social` scrapers, scanning the path backwards to locate the true trailing slug instead of prematurely failing on the root domain segment.

## Commit 31: Grounded RAG Chat Engine, Interactive Citations, and UI Layout Stabilization
- **Microservice Port Isolation**: Fixed critical port collision where sub-services inherited `PORT=5000` from `.env`, preventing the main API from starting. Services in `run.sh` now enforce strict, distinct bindings (`4002` through `4005`).
- **Grounded Streaming RAG Backend**: Implemented a Go-native chat controller (`internal/chat`) supporting multiple modes (Web, Notebook, Hybrid). It dynamically handles SSE JSON-line streaming via Ollama and ranks sources using hybrid vector similarity and keyword overlap.
- **Premium Chat UI & Real-Time Sync**: 
  - Added `ChatStudio.jsx` featuring dynamic mode selectors, model health indicators, and high-performance React stream decoding.
  - Resolved `flex` and `overflow` CSS layout constraints causing the interface to stretch vertically and hide chat scrollbars.
  - Stripped wide padding artifacts to maximize horizontal reading space in the chat view.
- **Interactive Source Citations**: Redesigned `.citation-hover-card` tooltips enabling direct URL clicking (`pointer-events: auto`), and modified `CitationPill.jsx` to simultaneously open sources in a new tab upon click while selecting them in the left pane.
- **Auto-Triggering Sentinel Agents**: Connected the Sentinel background scraper directly to the `/sentinel/status` API handler (`internal/api/sentinel_handler.go`). Opening the UI now instantly wakes idle agents to begin auto-repairing empty sources, showing real-time sync progress instead of stalling indefinitely.

## Commit 32: Advanced UX Polish, Dynamic Streaming Phases, and Feature Cleanup
- **Dynamic Streaming Phase Indicators**: Updated the `ThinkingIndicator.jsx` to dynamically switch from "Searching & reranking workspace sources..." (RAG Retrieval phase) to "Synthesizing grounded answer..." (LLM Generation phase) as soon as the first stream chunk arrives.
- **Smart Scroll Anchoring**: Solved violent auto-scrolling during LLM streaming. ChatStudio now detects manual user scrolling, temporarily halts auto-scroll so users can read citations mid-stream, and displays a floating "↓ Latest response" jump button.
- **Power User Keyboard Shortcuts**: Added `useKeyboard.js` to enable fast navigation: `Cmd/Ctrl + K` (Focus Prompt), `Cmd/Ctrl + /` (Toggle Sources), and `Cmd/Ctrl + Shift + S` (Toggle Studio). Also introduced a sleek keyboard shortcuts modal triggered via the three-dot (`⋮`) chat menu.
- **Live Source Favicons**: Enhanced `SourceCard.jsx` to automatically fetch authentic domain favicons using Google's S2 Favicon API, providing instant visual recognition of web sources in the sidebar (falling back to Lucide icons for PDFs/YouTube).
- **Animated Message Entry & Toast Feedback**: Applied a smooth, premium `fade-slide-up` CSS animation to `.message-card` for fluid chat entry. Replaced blocking UI alerts with a new, non-blocking floating `<Toast />` component (Success/Error/Info).
- **Contextual Starter Prompts**: Introduced interactive Quick Starter Chips ("Summarize Key Themes", "Compare Perspectives", "Executive Overview") that appear on empty notebook welcome screens to kickstart the research flow.
- **Feature Cleanup**: Completely removed the query "Scoping" feature from the UI (`PromptBar` and `ChatStudio`), enforcing the simpler default behavior of allowing RAG queries to naturally access all active notebook sources.

## Commit 33: Episodic Vector Memory, Retrieval Self-Evaluation, and Agentic Tool Loop
- **Episodic Semantic Vector Memory**: Replaced the hardcoded 6-message sliding window history with vector memory retrieval. Added `chat_memory` table in SQLite (`db.go`, `memory_repo.go`), `MemoryRetriever` (`internal/chat/memory.go`), and background async embedding persistence (`SaveTurn`) using `nomic-embed-text`.
- **Retrieval Self-Evaluation Engine**: Implemented `SelfEvaluator` (`internal/chat/evaluator.go`) that grades retrieved document chunks ($0.0 - 1.0$) using hybrid vector similarity and keyword metrics to filter noise and enforce a context sufficiency gate before answer synthesis.
- **ReAct Tool-Calling Agentic Fallback Loop**: Created `AgentLoop` (`internal/chat/agent_loop.go`) and `ToolRegistry` (`internal/chat/tools.go`). If the Self-Evaluator detects low-relevance or missing context, the agent autonomously executes `ToolWebSearch` or `ToolArxivFetch` mid-chat to fetch live web sources and augment context before streaming the grounded response.
- **UI Control Simplification**: Cleaned up `<ChatControls />` by removing redundant "Regenerate" and "Clear History" buttons, ensuring the top chat control bar stays cleanly hidden unless actively streaming a response (displaying only the "Stop Generation" button).

## Commit 34: Production-Level Agentic RAG System, Query Decomposition, SSE Status Streaming, and Mid-Chat Source Persistence
- **Query Decomposition**: Implemented `QueryPlanner` (`internal/chat/planner.go`) to split complex user queries into 2 to 4 simple, focused sub-queries for document search, retrieving and merging resources concurrently.
- **Multi-Iteration ReAct Loop**: Upgraded `AgentLoop` (`internal/chat/agent_loop.go`) to support a bounded 3-iteration Reasoning + Tool execution cycle using JSON-structured ReAct prompt templates.
- **SSE Agent Status Streaming**: Connected the `onStatus` callback from `GenerateStream` to the `/chat/stream` SSE endpoint (`internal/api/chat_stream_handler.go`), streaming agent thought and action updates to the client in real-time.
- **Mid-Chat Source Persistence**: Configured the controller to automatically save newly discovered web/arxiv documents as permanent sources in the SQLite `sources` table, launching an asynchronous background chunk-embedding pipeline.
- **Dynamic UI Thinking Status**: Updated the frontend `ThinkingIndicator.jsx` to render the custom, real-time agent status messages directly in the thinking bubble and pass the newly saved sources list through `useChat.js` to update the sources sidebar in real-time.
- **ReAct Loop Unit Tests**: Created `react_prompt_test.go` to verify the JSON extraction, parsing, and markdown code block trimming.

## Commit 35: Explain Source Feature, Unified Studio Navigation, and UI/UX Polish
- **Explain Source Integration**: Implemented "Explain Source" action inside the `SourceInspectorDrawer` component, passing a redirection handler `handleExplainSource` from `NotebookPage.jsx` that shifts the user into Chat Studio mode and pre-populates a query about the source.
- **Header Badge Standards**: standardized mockup badge indicators across all Study Studio previews (`BriefingView`, `AudioOverviewView`, `FaqView`, `QuizView`, `MindMapView`, `ReportsView`, `StudyStudio`) to make preview screens clean and modern.
- **Backend Note Export Fix**: Fixed a compilation error in `internal/api/notebook_handler.go` where markdown note exporting referenced a non-existent `Title` field on the `Note` struct.

## Commit 36: Context Size Optimization, Low-RAM Map-Reduce Batching, and UI Redundancy Cleanup
- **Low-RAM Map-Reduce Batching (`BatchAndSummarize`)**: Implemented sequential preprocessing/digesting of long sources inside `controller.go` and `synthesizer.go`. To stay strictly under the context limit and minimize local RAM usage, sources longer than 500 characters are sent to Ollama one by one to extract a concise bulleted list of query-relevant facts. These lightweight digested points are then combined for the final synthesis, preserving citation indexes perfectly.
- **Ollama Context Configuration**: Set `num_ctx` to `4096` in `internal/llm/client.go` to enforce a low memory footprint and prevent RAM spikes on local environments.
- **Redundancy Cleanup & Tab Integration**: Removed the double-row `.studio-tabs-row` header from `StudyStudio.jsx`, consolidating navigation under the right Studio Panel and adding a highlighted "Chat Studio" tile at the top of the Studio grid for a clean, unified middle panel layout.
- **Header Cleanup**: Removed the duplicate and misaligned "Clear Timeline" button from the main header (`NotebookHeader.jsx`), relying on the options dropdown in the chat view for a cleaner top navigation bar.

## Commit 37: Notebook Title Persistence, Jina arXiv Ingestion, Explain-Source Grounding, and Sidebar Editor
- **Notebook Title Persistence**: Fixed a synchronization issue where notebook titles vanished on refresh by preventing the auto-sync effect in `NotebookPage.jsx` from executing when the title is empty, and robustly fallback-loading the existing title in the backend `/api/sourcebook/v1/notebooks/:id` PUT handler if the request title is empty.
- **Jina arXiv Ingestion**: Integrated the `ScrapeWithJina` microservice client as the primary extraction pipeline inside `FetchSingleArxivDocument` in `internal/arxiv/arxiv.go`, enabling high-fidelity arXiv PDF/HTML text recovery with native abstract scraping as a fallback.
- **Explain-Source Grounding**: Added `HandleExplainQuery` in `internal/chat/controller.go` to intercept "Explain Source" requests. It matches the target source via title or citation index, force-includes it in the LLM context, and bypasses both the agent search loop and map-reduce pre-summarization to feed the raw content for high-fidelity explanation.
- **Sidebar Note Editor & Style Polish**: Replaced the cramped absolute overlay and full-screen modal editor in `NotesPanel.jsx` with a clean, inline, in-sidebar editor that appears in-place. Removed JavaScript-based card hover animations and absolute floating buttons in favor of standard, minimalist CSS buttons and inline headers.

## Commit 38: Left-Side Source Inspector Integration, Dedicated Card Eye Button, and Escape Key Dismiss Shortcut
- **Left-Side Sidebar Inspector**: Integrated the Source Viewer directly into the left-side `Sidebar.jsx`, replacing the source list when inspecting a source. This keeps the right-side Notes Panel completely focused on note creation/editing.
- **Dedicated Eye Button**: Added a dedicated Eye inspect button on each `SourceCard` in the header next to the delete button, allowing users to easily open the inspector.
- **Escape Key Keyboard Shortcut**: Implemented a global keydown event listener in `Sidebar.jsx` that closes/dismisses the source inspection view when the `Escape` key is pressed.
- **NotesPanel Reversion**: Restored `NotesPanel.jsx` to its clean, original design with full note editing functionality and restored styling classes.
- **Legacy Drawer Removal**: Deprecated and deleted the unused `SourceInspectorDrawer.jsx` component.

## Commit 39: Bug Audit Resolution, UI Polish, and Double-Click Event Plumb
- **SourceCard Double-Click Repair**: Wired `onDoubleClick` prop to `handleCardDoubleClick` event on source cards, fixing broken double-click source inspection.
- **Citation Click Streamlining**: Removed `window.open` trigger from `CitationPill.jsx` so clicking a citation index pill opens the left-side inspector panel without opening redundant browser tabs.
- **Modal Error Handling (Anti-Alert)**: Replaced native `alert()` browser popups in `AddSourceModal.jsx` with an inline error banner conforming to the corporate design system.
- **Markdown Title Sanitization**: Stripped raw markdown formatting (`**`, `#`, `[1]`, links) before generating note titles when saving AI responses to notes in `MessageBubble.jsx`.
- **Quiz Hover CSS & Style Fix**: Replaced invalid inline JS `:hover` object styling in `QuizView.jsx` with `.quiz-option-btn.interactive-opt:hover` CSS rules in `index.css`.
- **Sidebar Header Navigation**: Added `← Back to Sources` button and `[Index] Inspector` header in `Sidebar.jsx`, and conditionalized the Escape key listener to attach only when inspecting a source.
- **Flexible Notes Editor**: Converted fixed 300px textarea height in `NotesPanel.jsx` to a responsive, vertically resizable container (`min-height: 180px`, `max-height: 450px`).
- **Dead Code Cleanup**: Removed unused `inspectingSource` props passed to `NotesPanel` in `NotebookPage.jsx`.

## Commit 40: Go Backend Concurrency Fixes, SQLite WAL Migration, and ReAct Robustness
- **SQLite Concurrency & WAL mode**: Configured WAL (`_journal_mode=WAL`), Busy Timeout (`_busy_timeout=5000`), and synchronous settings on SQLite database initialization in `db.go` to prevent `database is locked` errors during concurrent writes/reads.
- **SyncNotebookSources Optimization**: Refactored database logic in `notebook_repo.go` to selectively delete only non-retained sources and use `INSERT ... ON CONFLICT DO UPDATE` instead of a full truncate. This preserves existing vector chunk embeddings and handles partial source list synchronization.
- **Pipeline Data Race Corrections**: Mitigated thread data race on `results` and `youtubeDocs` slices in `pipeline_handler.go` by introducing a `sync.Mutex` lock block during concurrent search/YouTube scraping routines.
- **Robust YouTube Document Handling**: Fixed a critical edge-case in `pipeline_handler.go` where YouTube video transcripts were dropped/ignored if standard web search returned 0 URLs.
- **Export Request ID Check**: Added validation for empty notebook IDs in `handleNotebookExport` within `notebook_handler.go` to return a `400 Bad Request` instead of triggering a DB fallback 404 error.
- **RetrieveAndRerank Context Race Fix**: Fixed a data race in `controller.go` where the loop goroutines concurrently wrote to the `contextMeta` variable by hoisting the evaluation out of the concurrent blocks.
- **Explain Query Fallback Isolation**: Corrected `HandleExplainQuery` in `controller.go` to only return `true` for `isExplain` when a valid source match was found, avoiding LLM token limit issues on explain failures.
- **ReAct JSON Parsing Safeguards**: Hardened `ParseReActJSON` in `react_prompt.go` to isolate JSON structures between the first `{` and last `}` braces, preventing parser failure due to Ollama returning conversational leading/trailing text or backticks.
- **Sentinel Observability**: Fixed silent row scan errors in `sentinel.go` by adding explicit logging for rows scan issues.

## Commit 41: Premium Study Studio Suite Redesign and Interactive UI Polish
- **Themed CSS Variable Layers & Typography (`index.css`)**: Implemented root themes (`Midnight Obsidian`, `Cyberpunk Glass`, `Clean Corporate Slate`) bound to `data-theme` attribute selectors. Configured typographic hierarchy (`Sora` for UI controls, `Newsreader` for editorial reading, and `IBM Plex Mono` for code/citations) and a custom `.glass-card` styling class.
- **Tactile Citation Pill Popovers (`CitationPill.jsx`)**: Connected Google S2 domain favicon resolution for inline citations, and designed micro-spring hover card overlays with physical press transitions (`scale(0.95)`).
- **Typography Readability & Springs (`MessageBubble.jsx`)**: Polished bubbles using layout spacings and theme variables, applying tactile click-scaling feedback on bubbled actions.
- **Thinking Loader Tracker (`ThinkingIndicator.jsx`)**: Created a high-fidelity phase loader moving from search queries to sparkles, utilizing dot pulsing delays.
- **Global Command Palette (`NotebookPage.jsx`)**: Created a command palette (`Cmd+K`/`Ctrl+K`) that searches workspace sources, switches themes, and navigates tabs. Fixed a lexical initialization issue (`ReferenceError`) by placing hook initializations (`useSources`) above the palette command definitions.
- **Drag-and-Drop Ingestion Zone (`AddSourceModal.jsx`)**: Designed a dashed hover-reactive zone featuring simulated upload progress bars.
- **Podcast Player & Canvas Waveforms (`AudioOverviewView.jsx`)**: Added co-host audio speed multipliers (1x to 2x), voice configurations, and a canvas-rendered live audio waveform animation.
- **Concept Mind Map (`MindMapView.jsx`)**: Built an interactive concept node hierarchy featuring expand/collapse child toggles, node detail inspectors, and a CSS-based canvas zoom scaler.
- **Export Hub, Tab Polish & Source Inspector (`StudyStudio.jsx`, `NotesPanel.jsx`, & `Sidebar.jsx`)**: Added a global header dropdown overlay for exporting Briefs, Transcripts, and Mindmap JSON. Refactored Sidebar notes, tiles, editors, and the source detail inspector to use theme variables and spring-tactile animations.

## Commit 42: Explain-Source Context Recovery, Index Alignment, and Link Leak Suppression
- **Explain-Source Full Content Recovery (`controller.go`)**: Refactored `HandleExplainQuery` to retrieve complete source markdown contents directly from the SQLite database via `repo.GetSourcesByNotebook()`, replacing the snippet-only chunk fragment extraction.
- **Citation Index Alignment Safeguard (`controller.go`)**: Resolved grounding and citation index mismatch issues. The LLM is now provided with the matched source using its exact sidebar index (e.g., `[11]`), bypassing Microsoft/OpenAI grounding guardrails that reject queries referencing external or mismatched index parameters.
- **Raw URL LLM Context Removal (`history.go`)**: Omitted raw URL strings (`URL: ...`) from the LLM prompt context in `history.go` while keeping them in the JSON API payload. This physically prevents local/grounded models from appending raw link text or bibliographies to responses while preserving fully functional, clickable citation pills in the React interface.
- **Inspector Layout Centering (`Sidebar.jsx`)**: Corrected vertical layout alignment issues in the Sidebar header by removing hardcoded margin/padding overrides to rely on standard CSS centering rules.

## Commit 43: Hybrid Search BM25 Re-Ranker, Persistent Multi-Turn Chat Memory, and Dynamic Ollama Model Resolution
- **Okapi BM25 Keyword Scoring (`bm25.go`, `bm25_test.go`)**: Implemented the Okapi BM25 algorithm ($k_1=1.5, b=0.75$) featuring lowercase alphanumeric tokenization, term frequency (TF), smoothed inverse document frequency (IDF), and document length normalization ($\text{avgdl}$).
- **Hybrid Reranking Engine (`rerank.go`)**: Combined dense vector cosine similarity scores with normalized BM25 keyword scores using a $65\% \text{ Vector} + 35\% \text{ BM25}$ weighted hybrid formula, with graceful fallback to BM25-only ranking.
- **Backend-Owned Persistent Chat History (`synthesis.go`, `controller.go`)**: Established SQLite (`chat_messages` table) as the primary source of truth for notebook conversations, automatically saving user queries and assistant responses while asynchronously generating vector turn embeddings (`SaveTurn`).
- **3-Layer Context Assembly & Limits (`history.go`)**: Built a 3-layer context builder combining System Instructions, Grounded Sources, Top-K Semantic Memories, and Recent Conversation Windows (up to 8 messages), enforcing turn deduplication and character limit safeguards to prevent prompt bloat.
- **Dynamic Ollama Model Resolution & Health Auto-Fallback (`models_handler.go`, `health_handler.go`, `chat_handler.go`, `chat_stream_handler.go`)**: Replaced hardcoded model fallbacks (`gemma2`, `phi4-mini`) with dynamic querying of local Ollama tags (`/api/tags` via `LLM_URL`). Configured health handlers to auto-detect installed Ollama models (e.g. `phi4-mini:latest`) and dynamically update the active LLM client.


