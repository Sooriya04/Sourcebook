.PHONY: all help build build-backend build-ui dev dev-server dev-ui test clean docker-build docker-up docker-down install check lines

BINARY_DIR := bin
BINARY_NAME := sourcebook-server
SERVER_MAIN := ./cmd/server/main.go
UI_DIR := ui

all: build

help:
	@echo "SourceBook Management Commands:"
	@echo "  make install       - Install Go and Node dependencies"
	@echo "  make build         - Build both frontend and Go server binary"
	@echo "  make build-backend - Build Go server binary to bin/$(BINARY_NAME)"
	@echo "  make build-ui      - Build production React assets in ui/dist"
	@echo "  make dev           - Run Go server and Vite frontend concurrently"
	@echo "  make dev-server    - Run Go backend server directly"
	@echo "  make dev-ui        - Start Vite frontend dev server (port 3000)"
	@echo "  make test          - Run all Go unit and integration tests"
	@echo "  make lines         - Check source files adhere to <200 lines rule"
	@echo "  make docker-up     - Start all services with docker-compose"
	@echo "  make docker-down   - Stop docker-compose services"
	@echo "  make clean         - Remove build binaries and frontend dist"

install:
	@echo "Installing backend dependencies..."
	go mod tidy
	@echo "Installing frontend dependencies..."
	cd $(UI_DIR) && npm install

build-ui:
	@echo "Building frontend..."
	cd $(UI_DIR) && npm run build

build-backend:
	@echo "Building backend..."
	@mkdir -p $(BINARY_DIR)
	go build -o $(BINARY_DIR)/$(BINARY_NAME) $(SERVER_MAIN)

build: build-ui build-backend
	@echo "Full production build completed successfully."

dev-server:
	go run $(SERVER_MAIN)

dev-ui:
	cd $(UI_DIR) && npm run dev

dev:
	@echo "Starting backend and frontend..."
	@trap 'kill 0' EXIT; \
	go run $(SERVER_MAIN) & \
	(cd $(UI_DIR) && npm run dev) & \
	wait

test:
	go test -v ./...

lines:
	@echo "Verifying all source files are strictly under 200 lines..."
	@python3 -c 'import os, sys; violations = [(sum(1 for _ in open(os.path.join(r, f), errors="ignore")), os.path.join(r, f)) for r, d, files in os.walk(".") if not any(p in r for p in [".venv", "venv", "node_modules", ".git", "dist", "bin", "others"]) for f in files if f.endswith((".go", ".jsx", ".js")) and not f.endswith("_test.go")]; [print(f"  {c} lines: {p}") for c, p in violations if c > 200]; sys.exit(1 if any(c > 200 for c, p in violations) else 0) if violations else None; print("All source files strictly adhere to the <200 lines rule.")'

check: test lines

docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

clean:
	@echo "Cleaning artifacts..."
	rm -rf $(BINARY_DIR)
	rm -rf $(UI_DIR)/dist
	@echo "Clean completed."
