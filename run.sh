#!/usr/bin/env bash

# SourceBook Unified Microservice Runner Script
# Launches both the Go SourceBook Server (Port 5000) and YouTube Microservice (Port 6001)
fuser -k 5000/tcp
fuser -k 6001/tcp


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

# 2. Build and Start Go SourceBook Backend Server
echo "⚡ Starting Go SourceBook Backend Server on port ${PORT:-5000}..."
go run ./cmd/server/main.go &

# Wait for background jobs
wait
