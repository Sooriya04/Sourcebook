# Search & Scrape Pipeline

The Search & Scrape Pipeline forms the primary web discovery phase of SourceBook. It queries multiple web sources via SearXNG and extracts clean Markdown using Searqon.

---

## 🖼️ Pipeline Diagram

![Search + Scrape Pipeline](./images/Search%2BScrape%20Pipeline.png)

---

## ⚙️ Operational Flow

1. **User Query**: Request is received via `GET/POST /api/sourcebook/v1/search`.
2. **SearXNG Query Execution**: Unified Search Controller dispatches concurrent requests to local SearXNG (`http://localhost:8080`).
3. **Normalization**: Upstream search results are mapped into standard `SearchResult` schema.
4. **Searqon Extraction**: `POST /api/sourcebook/v1/pipeline` submits target URLs to Searqon (`http://127.0.0.1:4001/scrape/batch`).
5. **Text Cleaning**: Scraped markdown is processed via `utils.CleanText()` to eliminate bloat and redundant newlines.
