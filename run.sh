#!/usr/bin/env bash

# SourceBook Unified Microservice Runner Script
# Launches both the Go SourceBook Server (Port 5000) and YouTube Microservice (Port 6001)
fuser -k 5000/tcp
fuser -k 6001/tcp
fuser -k 8010/tcp
fuser -k 8020/tcp
fuser -k 4002/tcp


set -e

echo "🚀 Launching SourceBook Unified Microservices..."

#Kill Process Using Port 5000


# Load environment variables from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Function to handle shutdown
cleanup() {
  echo ""
  echo "🛑 Stopping services..."
  kill $(jobs -p) 2>/dev/null || true
  exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 1. Activate Virtual Environment (.venv) & Start YouTube Microservice
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

if [ -d "services/youtube" ]; then
  echo "📺 Starting YouTube Transcript Microservice on port 6001..."
  (cd services/youtube && uvicorn main:app --port 6001 --host 0.0.0.0) &
else
  echo "⚠️ YouTube service directory not found, skipping..."
fi

if [ -d "services/search" ]; then
  echo "🔍 Starting Search Microservice on port 8010..."
  (cd services/search && uvicorn main:create_app --factory --port 8010 --host 0.0.0.0) &
else
  echo "⚠️ Search service directory not found, skipping..."
fi

if [ -d "services/embeddings" ]; then
  echo "🧠 Starting Embeddings Microservice on port 8020..."
  (cd services/embeddings && uvicorn main:app --port 8020 --host 0.0.0.0) &
else
  echo "⚠️ Embeddings service directory not found, skipping..."
fi

if [ -d "services/document" ]; then
  echo "📄 Starting Go Document Ingestion Microservice on port 4002..."
  (cd services/document && go run main.go) &
else
  echo "⚠️ Document service directory not found, skipping..."
fi


# 2. Build and Start Go SourceBook Backend Server
echo "⚡ Starting Go SourceBook Backend Server on port ${PORT:-5000}..."
go run ./cmd/server/main.go &

# Wait for background jobs
wait
