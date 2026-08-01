# SourceBook YouTube Service

This is a microservice built with FastAPI that provides an API for extracting transcripts from YouTube videos. It uses the `youtube-transcript-api` to fetch video captions and serves them in a structured JSON response.

## Features

- **Extract Transcripts**: Get full text and segment details of a YouTube video transcript.
- **Support for Various URLs**: Supports standard YouTube links, shortened `youtu.be` links, and YouTube Shorts.
- **Health Check**: Endpoint to verify service health and version.

## Requirements

- Python 3.9+
- FastAPI
- Uvicorn
- youtube-transcript-api
- pydantic-settings

## Installation

1. Clone or navigate to the repository.
2. Install the required dependencies:

```bash
pip install -r requirements.txt
```

## Running the Service

Start the FastAPI development server using Uvicorn on port 6001:

```bash
uvicorn main:app --reload --port 6001
```

The service will be available at `http://127.0.0.1:6001`.

## API Endpoints

### 1. Health Check
Check the status of the service.

- **URL**: `/health`
- **Method**: `GET`
- **Response**:
```json
{
  "status": "healthy",
  "service": "SourceBook YouTube Service",
  "version": "1.0.0"
}
```

### 2. Fetch Transcript
Extract the transcript for a given YouTube video URL.

- **URL**: `/youtube/transcript`
- **Method**: `POST`
- **Request Body**:
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
}
```
- **Response**:
```json
{
  "text": "Never gonna give you up ..."
}
```

## Environment Variables

You can configure the application using a `.env` file in the root directory.

- `APP_NAME`: Name of the application (default: "SourceBook YouTube Service")
- `VERSION`: Application version (default: "1.0.0")

## Logging

Logs are automatically created in the `logs` directory and rotated when they reach a certain size (10MB).
