# Stage 1: Build the React UI
FROM node:20-alpine AS ui-builder
WORKDIR /app/ui
COPY ui/package*.json ./
RUN npm ci
COPY ui/ ./
RUN npm run build

# Stage 2: Build the Go server
FROM golang:1.22-bookworm AS go-builder
WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
COPY --from=ui-builder /app/ui/dist ./ui/dist
RUN CGO_ENABLED=1 GOOS=linux go build -o /app/bin/sourcebook-server ./cmd/server/main.go

# Stage 3: Minimal runtime container
FROM debian:bookworm-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    sqlite3 \
    && rm -rf /var/lib/apt/lists/*

COPY --from=go-builder /app/bin/sourcebook-server /app/sourcebook-server
COPY --from=ui-builder /app/ui/dist /app/ui/dist

EXPOSE 5000

ENV PORT=5000
CMD ["/app/sourcebook-server"]
