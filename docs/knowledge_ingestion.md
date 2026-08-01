# Knowledge Ingestion Pipeline

The Knowledge Ingestion Pipeline processes user documents (PDFs, Markdown, Plain Text, Web URLs, Audio Transcripts) into standardized text chunks for vector indexing and LLM context building.

---

## 🖼️ Ingestion Diagram

![Knowledge Ingestion Pipeline](./images/Knowledge%20Ingestion%20Pipeline.png)

---

## 🛠️ Ingestion Steps

1. **Document Loading**:
   - Web documents parsed via Searqon.
   - Client-side document parsing in browser (`fileIngestor.js`).
2. **Text Normalization (`utils.CleanText`)**:
   - Strips whitespace bloat, duplicate carriage returns, and invalid UTF-8 characters.
3. **Chunking & Indexing**:
   - Prepares clean text into structured snippets ready for local SQLite and vector search storage.
