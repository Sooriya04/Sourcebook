# Hierarchical Architecture Graph

The Hierarchical Architecture Graph maps component ownership, internal modular boundaries, and operational dependencies across the SourceBook system layers.

---

## 🖼️ Architecture Graph

![Hierarchical Architecture Graph](./images/hierarchical%20architecture%20graph.png)

---

## 🧩 Layer Decomposition

- **Presentation Layer**: React UI components divided into layout shells, source managers, chat studios, and note editors.
- **API Routing Layer**: Versioned API endpoints located under `/api/sourcebook/v1/`.
- **Orchestration Layer**: `synthesis` package coordinating search, scraping, text sanitization, and LLM completions.
- **Provider Layer**: Pluggable provider registry interfacing with SearXNG and internet search sources.
- **Utility Layer**: Shared utilities including `utils.CleanText()` for whitespace and newline normalization.
