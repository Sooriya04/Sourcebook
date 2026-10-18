#!/usr/bin/env bash

# SourceBook Unified Microservice Runner Script
# Cleans stale processes, launches essential services (6001, 6002, 6003), and runs SourceBook Server (5000)

echo "🧹 Freeing up stale ports and stopping orphan processes..."
fuser -k 5000/tcp 6001/tcp 6002/tcp 6003/tcp 4002/tcp 4003/tcp 4004/tcp 4005/tcp 8010/tcp 2>/dev/null || true
pkill -9 -f "embed.py" 2>/dev/null || true
sleep 0.5

set -e

echo "🚀 Launching SourceBook Unified Microservices..."

# Load environment variables from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Function to handle shutdown
cleanup() {
  echo ""
  echo "🛑 Stopping all services..."
  kill $(jobs -p) 2>/dev/null || true
  fuser -k 5000/tcp 6001/tcp 6002/tcp 6003/tcp 4002/tcp 4003/tcp 4004/tcp 4005/tcp 8010/tcp 2>/dev/null || true
  pkill -9 -f "embed.py" 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 1. Activate Virtual Environment (.venv)
if [ -d ".venv" ]; then
  echo "🐍 Activating root Python virtual environment (.venv)..."
  source .venv/bin/activate
elif [ -d "services/youtube/venv" ]; then
  echo "🐍 Activating YouTube virtual environment (services/youtube/venv)..."
  source services/youtube/venv/bin/activate
elif [ -d "services/youtube/.venv" ]; then
  echo "🐍 Activating YouTube virtual environment (services/youtube/.venv)..."
  source services/youtube/.venv/bin/activate
fi

# 2. Launch Essential Python Microservices
# Port 6001: YouTube Transcript Microservice
if [ -d "services/youtube" ]; then
  echo "📺 Starting YouTube Transcript Microservice on port 6001..."
  (cd services/youtube && uvicorn main:app --port 6001 --host 0.0.0.0) &
fi

# Port 6002: Local Embedding Microservice
if [ -d "services/embedding" ]; then
  echo "🧠 Starting Local Embedding Microservice on port 6002..."
  (cd services/embedding && uvicorn main:app --port 6002 --host 0.0.0.0) &
fi

# Port 6003: Kokoro Audio Microservice
if [ -d "services/audio" ]; then
  echo "🎙️ Starting Kokoro TTS Audio Microservice on port 6003..."
  (cd services/audio && uvicorn main:app --port 6003 --host 0.0.0.0) &
fi

# 3. Build and Start Go SourceBook Server (serves UI, Search, RAG, and Document Parsing)
echo "⚡ Building and starting Go SourceBook Server on port ${PORT:-5000}..."
go build -o bin/sourcebook-server ./cmd/server/main.go
./bin/sourcebook-server &

# Wait for all background services
wait
