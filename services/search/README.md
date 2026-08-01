# SourceBook Search Service

FastAPI microservice for query planning and SearXNG search orchestration.

This service does not answer user questions. It generates a structured search
plan with Ollama, executes the planned queries through SearXNG, and returns
normalized search results.

## Run locally

```bash
cd services/search
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:create_app --factory --host 0.0.0.0 --port 8010
```

## Endpoints

- `GET /api/sourcebook/v1/health`
- `GET /api/sourcebook/v1/search?q=transformer+architecture`
- `POST /api/sourcebook/v1/search`

Example request:

```json
{
  "query": "Understand Transformer Architecture",
  "max_results": 10
}
```
