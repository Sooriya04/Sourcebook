# SourceBook — Test Specification & Regression Test Matrix

This document defines the comprehensive test architecture, regression test suites, and automated verification matrices for the **SourceBook** platform.

---

## 🏛️ Testing Architecture & Strategy

SourceBook enforces a pragmatic, 3-tier testing pyramid designed to catch production regressions without brittle mocks or slow test runs:

1. **Unit & Protocol Tests**: Fast, in-memory validation of prompt formats, sanitization utilities, and data structures.
2. **Integration & Resilience Tests**: Simulated HTTP round-trips verifying failure recovery, dead-port handling, and dynamic provider switching.
3. **Automated CI Gates**: Strict automated enforcement in `.github/workflows/ci.yml` verifying line limits (<200 lines), race conditions, and clean builds.

---

## 📋 Comprehensive Test Case Matrix

### Suite 1: Provider Switching & Endpoint Failure Recovery (`TC-PROV`)

| Test ID | Test Name | Target Component | Scenario & Input Payload | Expected Output & Assertion |
| :--- | :--- | :--- | :--- | :--- |
| **TC-PROV-001** | Dead Port Fast-Fail | `internal/llm`, `internal/api/health_handler.go` | Configure `llm_base_url` to an unallocated port (`http://127.0.0.1:59999/v1`). Call `HandleLLMHealth` and `Generate`. | Fails fast within 3s. Returns structured error `"connection refused"`. Status is marked `"offline"`. Server does not hang or panic. |
| **TC-PROV-002** | Dynamic Provider Mutation No-Bleed | `internal/api/settings_handler.go`, `internal/llm/client.go` | Start on `openai` (`mockA`). Call `PUT /settings` with `gemini` (`mockB`). Call `/study/mindmap`. | Request immediately routes to `mockB`. Zero URL or header bleeding from `mockA`. |
| **TC-PROV-003** | Empty Key Update Preserves Credential | `internal/database/settings_repo.go` | Send `PUT /settings` with a new model/URL but an empty `llm_api_key: ""`. | Existing API key in SQLite `user_settings` is preserved and not overwritten with empty string. |
| **TC-PROV-004** | Health Check Timeout Guard | `internal/api/health_handler.go` | Simulate a slow mock LLM endpoint delaying response for 20 seconds. | Health check context times out cleanly at 15s. Returns `"offline"` without blocking subsequent requests. |

---

### Suite 2: Study Engine Slop & Schema Resilience (`TC-STUDY`)

| Test ID | Test Name | Target Component | Scenario & Input Payload | Expected Output & Assertion |
| :--- | :--- | :--- | :--- | :--- |
| **TC-STUDY-001** | Mind Map Preamble Stripping | `internal/api/study_mindmap.go`, `internal/llm/study_prompt.go` | Mock LLM returns conversational slop with markdown code fences: <br>`Sure! Here is the JSON:`<br>````json {"root": {"id": "root", "label": "AI", "desc": "...", "children": []}} ```` | `extractJSON` strips code fences and conversational preamble. Handler returns HTTP 200 with valid `MindMapResponse`. |
| **TC-STUDY-002** | Quiz Arena 4-Option MCQ Validation | `internal/api/study_quiz.go`, `internal/synthesis/study.go` | Mock LLM returns 5 multiple-choice questions in JSON. | Each question contains exactly 4 options, a valid 0-based `answerIndex` (0–3), and an explanation. |
| **TC-STUDY-003** | FAQ Q&A Pair Extraction | `internal/api/study_faq.go`, `internal/synthesis/study.go` | Mock LLM returns array of `{"q": "...", "a": "..."}` objects. | Handler successfully unmarshals JSON and returns `FaqResponse{FAQ: items}`. |
| **TC-STUDY-004** | Truncated JSON Graceful Recovery | `internal/api/study_*.go` | Mock LLM returns cut-off/corrupted JSON (`[{"id": 1, "question": "What is...`). | Handler does not panic. Logs diagnostic error and returns HTTP 500 with structured JSON detail. |

---

### Suite 3: Document Ingestion & Chunking Lifecycle (`TC-DOC`)

| Test ID | Test Name | Target Component | Scenario & Input Payload | Expected Output & Assertion |
| :--- | :--- | :--- | :--- | :--- |
| **TC-DOC-001** | Multipart PDF Text Extraction | `internal/api/document_handler.go`, `github.com/ledongthuc/pdf` | Upload a valid PDF file via `POST /parse/pdf` using `multipart/form-data`. | Extracted text is normalized with `utils.CleanText()`, title is sanitized, returns HTTP 200 with `DocumentParseResponse`. |
| **TC-DOC-002** | Multipart Markdown & Text Sanitization | `internal/api/document_handler.go` | Upload Markdown with carriage returns and excessive whitespace to `/parse/markdown`. | Strips whitespace bloat, normalizes line breaks, and returns cleaned content. |
| **TC-DOC-003** | Chunking Bounding & Cascade | `internal/vector/chunker.go`, `internal/database/chunk_repo.go` | Ingest a 50,000-character document into a notebook. | Document is partitioned into bounded chunks within token limits. Foreign key cascades cleanly upon source deletion. |

---

### Suite 4: Search & Degraded Mode Fallback (`TC-SEARCH`)

| Test ID | Test Name | Target Component | Scenario & Input Payload | Expected Output & Assertion |
| :--- | :--- | :--- | :--- | :--- |
| **TC-SEARCH-001** | SearXNG 500 Fallback to DuckDuckGo | `internal/controller/search.go` | SearXNG returns HTTP 500 or network timeout during search. | `UnifiedSearchController` catches failure, activates DuckDuckGo fallback, and returns live search results without erroring. |
| **TC-SEARCH-002** | Native Query Planning Decomposition | `internal/api/notebook_update.go`, `internal/chat/planner.go` | User saves long text source (>50 chars). Asynchronous enrichment triggers `chat.NewQueryPlanner`. | Generates 2-3 focused subqueries without making external calls to port 8010. |
| **TC-SEARCH-003** | Empty Search Query Validation | `internal/api/search_handler.go` | Send `GET /api/sourcebook/v1/search?q=` with empty query. | Returns HTTP 400 Bad Request with `"query is required"`. |

---

### Suite 5: Quality Gates & CI Enforcement (`TC-CI`)

| Test ID | Test Name | Target Component | Verification Command | Gate Criteria |
| :--- | :--- | :--- | :--- | :--- |
| **TC-CI-001** | Strict File Line Limits | All Go, JSX, and JS files | `make lines` | Fails CI if any file exceeds 200 lines (excluding test files and dist). |
| **TC-CI-002** | Race Condition Detection | Entire Go backend | `go test -race ./...` | Fails CI if any race condition or concurrent map read/write is detected. |
| **TC-CI-003** | Clean Production Frontend Build | React UI | `cd ui && npm run build` | Fails CI if Vite compilation throws syntax, TypeScript, or bundling errors. |

---

## 🚀 Running Tests Locally

```bash
# Run all standard backend unit & protocol tests
make test

# Run line limit compliance verification (<200 lines rule)
make lines

# Run complete quality check (test + lines)
make check

# Build and verify frontend production bundle
cd ui && npm run build
```
