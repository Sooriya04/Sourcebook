import logging
import math
import re
from typing import List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("embeddings_service")

# Try importing ML libraries, fallback to pure python if unavailable
USE_TRANSFORMERS = True
try:
    from sentence_transformers import SentenceTransformer
    from langchain_text_splitters import RecursiveCharacterTextSplitter
    logger.info("sentence-transformers and langchain are available. Loading 'all-MiniLM-L6-v2' model...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50, length_function=len)
    logger.info("Model and splitter initialized successfully.")
except ImportError:
    USE_TRANSFORMERS = False
    logger.warning("⚠️ sentence-transformers or langchain not found. Falling back to dependency-free FNV-1a Hashing TF Vectorizer (384 dimensions) for local-offline execution.")

# Pure python text splitter fallback
def split_text_fallback(text: str, chunk_size: int = 500, chunk_overlap: int = 50) -> List[str]:
    paragraphs = text.split("\n\n")
    chunks = []
    current_chunk = ""
    for p in paragraphs:
        p = p.strip()
        if not p:
            continue
        if len(current_chunk) + len(p) + 2 <= chunk_size:
            current_chunk = (current_chunk + "\n\n" + p).strip()
        else:
            if current_chunk:
                chunks.append(current_chunk)
            if len(p) > chunk_size:
                sentences = re.split(r'(?<=[.!?])\s+', p)
                curr = ""
                for s in sentences:
                    if len(curr) + len(s) + 1 <= chunk_size:
                        curr = (curr + " " + s).strip()
                    else:
                        if curr:
                            chunks.append(curr)
                        curr = s
                current_chunk = curr
            else:
                current_chunk = p
    if current_chunk:
        chunks.append(current_chunk)
    return chunks

# Pure python FNV-1a hashing vectorizer fallback (384 dimensions, L2 normalized)
def get_embedding_fallback(text: str, dimensions: int = 384) -> List[float]:
    text = text.lower()
    words = re.findall(r'\w+', text)
    vector = [0.0] * dimensions
    if not words:
        return vector

    for word in words:
        # FNV-1a hash algorithm
        h = 2166136261
        for char in word:
            h = h ^ ord(char)
            h = (h * 16777619) & 0xffffffff
        idx = h % dimensions
        vector[idx] += 1.0

    # L2 Normalization
    norm = math.sqrt(sum(v * v for v in vector))
    if norm > 0:
        vector = [v / norm for v in vector]
    return vector

app = FastAPI(
    title="SourceBook Embeddings Service",
    description="Stand-alone microservice for local text chunking and embedding generation.",
    version="0.1.0"
)

class GenerateRequest(BaseModel):
    text: str = Field(..., min_length=1, description="Raw text to be chunked and embedded.")

class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, description="Query string to generate a vector for.")

@app.get("/health")
def health():
    return {
        "status": "ok", 
        "engine": "transformers" if USE_TRANSFORMERS else "pure_python_hash",
        "model": "all-MiniLM-L6-v2" if USE_TRANSFORMERS else "hashing_tf_384"
    }

@app.post("/api/sourcebook/v1/embeddings/generate")
def generate_embeddings(payload: GenerateRequest):
    try:
        if USE_TRANSFORMERS:
            chunks = splitter.split_text(payload.text)
            if not chunks:
                return []
            embeddings = model.encode(chunks)
            return [
                {"chunk": chunk, "embedding": emb.tolist()}
                for chunk, emb in zip(chunks, embeddings)
            ]
        else:
            chunks = split_text_fallback(payload.text)
            return [
                {"chunk": chunk, "embedding": get_embedding_fallback(chunk)}
                for chunk in chunks
            ]
    except Exception as e:
        logger.error(f"Error generating embeddings: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/sourcebook/v1/embeddings/query")
def query_embedding(payload: QueryRequest):
    try:
        if USE_TRANSFORMERS:
            embedding = model.encode(payload.query)
            return {"embedding": embedding.tolist()}
        else:
            return {"embedding": get_embedding_fallback(payload.query)}
    except Exception as e:
        logger.error(f"Error generating query embedding: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
