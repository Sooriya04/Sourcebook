import os
import sys
import asyncio
from typing import List, Optional
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
from services.embedding.embedder import MiniLMEmbedder

# Concurrency semaphore: prevent CPU oversubscription during bursts
MAX_CONCURRENT_INFERENCES = int(os.getenv("MAX_CONCURRENT_EMBEDDINGS", "16"))
semaphore = None
embedder = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global semaphore, embedder
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_INFERENCES)
    # Warm up ONNX session on startup
    embedder = MiniLMEmbedder.get_instance()
    _ = embedder.embed_batch(["warmup"])
    yield

app = FastAPI(title="SourceBook Embedding Microservice", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EmbedRequest(BaseModel):
    text: Optional[str] = None
    texts: Optional[List[str]] = None

class OllamaEmbedRequest(BaseModel):
    model: Optional[str] = "all-MiniLM-L6-v2"
    prompt: Optional[str] = ""

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "embedding",
        "model": "all-MiniLM-L6-v2",
        "dimension": 384
    }

@app.post("/embed")
async def embed(req: EmbedRequest):
    batch = []
    if req.texts:
        batch = [t for t in req.texts if t]
    elif req.text:
        batch = [req.text]

    if not batch:
        raise HTTPException(status_code=400, detail="Empty text or texts payload provided")

    async with semaphore:
        # Offload sync ONNX compute to threadpool so event loop remains non-blocking
        embeddings = await asyncio.to_thread(embedder.embed_batch, batch)

    return {
        "embeddings": embeddings,
        "dimension": 384,
        "count": len(embeddings)
    }

@app.post("/api/embeddings")
async def ollama_compatible_embeddings(req: OllamaEmbedRequest):
    """Ollama API compatibility endpoint for drop-in usage."""
    if not req.prompt:
        return {"embedding": [0.0] * 384}

    async with semaphore:
        embeddings = await asyncio.to_thread(embedder.embed_batch, [req.prompt])

    return {"embedding": embeddings[0] if embeddings else [0.0] * 384}

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 6002))
    uvicorn.run("main:app", host="0.0.0.0", port=port, app_dir=os.path.dirname(__file__))
