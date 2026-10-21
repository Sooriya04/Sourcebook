FROM python:3.11-slim

WORKDIR /app

# Install system audio dependencies (libsndfile for soundfile, espeak-ng for phonemization)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libsndfile1 \
    espeak-ng \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy service code and pre-downloaded ONNX models
COPY . .

EXPOSE 6003

ENV AUDIO_OUTPUT_DIR=/app/database/audio

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "6003"]
