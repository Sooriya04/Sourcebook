.PHONY: all help build build-backend build-ui dev dev-server dev-ui dev-youtube dev-searqon dev-all run stop status restart test check lines clean podman-build podman-up podman-down compose-build compose-up compose-down docker-build docker-up docker-down install

BINARY_DIR       := bin
BINARY_NAME      := sourcebook-server
SERVER_MAIN      := ./cmd/server/main.go
UI_DIR           := ui
PYTHON_BIN       := .venv/bin/python
CONTAINER_ENGINE ?= $(shell which podman 2>/dev/null || which docker 2>/dev/null || echo podman)
COMPOSE_CMD      ?= $(CONTAINER_ENGINE) compose

all: build

help:
	@echo "=========================================================="
	@echo "  SourceBook Unified Intelligence Platform — Makefile"
	@echo "=========================================================="
	@echo "Build Commands:"
	@echo "  make build         - Compile production frontend & Go binary"
	@echo "  make build-backend - Compile Go server to bin/$(BINARY_NAME)"
	@echo "  make build-ui      - Build production React assets in ui/dist"
	@echo "  make install       - Install Go and npm dependencies"
	@echo "  make clean         - Remove build binaries and ui/dist"
	@echo ""
	@echo "Production Commands:"
	@echo "  make run           - Run production stack (Build + Searqon 4001 + YouTube 6001 + Server 5000)"
	@echo ""
	@echo "Development Commands:"
	@echo "  make dev           - Run Server (5000), Vite (3000), YouTube (6001)"
	@echo "  make dev-all       - Run all microservices (Searqon + YouTube + Server + UI)"
	@echo "  make dev-server    - Run Go backend server directly"
	@echo "  make dev-ui        - Start Vite frontend dev server (port 3000)"
	@echo "  make dev-youtube   - Start YouTube Transcript microservice (port 6001)"
	@echo "  make dev-searqon   - Start Searqon scraper microservice (port 4001)"
	@echo "  make status        - Probe status of all microservices & ports"
	@echo "  make stop          - Terminate running services on 5000, 6001, 3000, 4001"
	@echo "  make restart       - Stop and restart development environment"
	@echo ""
	@echo "Quality & Testing:"
	@echo "  make test          - Run all Go test suites"
	@echo "  make lines         - Verify all source files adhere to <200 lines rule"
	@echo "  make check         - Run test and lines verification"
	@echo ""
	@echo "Container Commands (Podman local default, Docker for GitHub CI):"
	@echo "  make podman-up     - Start container stack using Podman ($(COMPOSE_CMD) up -d)"
	@echo "  make podman-down   - Stop Podman container stack"
	@echo "  make compose-up    - Start container stack using $(CONTAINER_ENGINE)"
	@echo "  make compose-down  - Stop container stack"
	@echo "  make docker-up     - Start container stack (alias for CI / Docker)"
	@echo "  make docker-down   - Stop container stack (alias for CI / Docker)"

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

run: build
	@echo "Cleaning up stale ports (5000, 6001, 4001, 4002, 4003, 4004, 4005, 3000)..."
	@fuser -k 5000/tcp 6001/tcp 4001/tcp 4002/tcp 4003/tcp 4004/tcp 4005/tcp 3000/tcp 2>/dev/null || true
	@echo "Starting production services (Searqon: 4001, YouTube: 6001, SourceBook: 5000)..."
	@trap 'kill 0' EXIT; \
	(if [ -f "/home/sooriya/Documents/Searqon/bin/searqon" ]; then cd /home/sooriya/Documents/Searqon && ./bin/searqon; fi) & \
	($(PYTHON_BIN) -m uvicorn main:app --port 6001 --host 0.0.0.0 --app-dir services/youtube) & \
	(if [ -f "bin/document-service" ]; then PORT=4002 ./bin/document-service; fi) & \
	(if [ -f "bin/jina-service" ]; then PORT=4003 ./bin/jina-service; fi) & \
	(if [ -f "bin/reddit-service" ]; then PORT=4004 ./bin/reddit-service; fi) & \
	(if [ -f "bin/social-service" ]; then PORT=4005 ./bin/social-service; fi) & \
	./bin/$(BINARY_NAME)

dev-server:
	go run $(SERVER_MAIN)

dev-ui:
	cd $(UI_DIR) && npm run dev

dev-youtube:
	@echo "Starting YouTube Transcript microservice on port 6001..."
	@$(PYTHON_BIN) -m uvicorn main:app --port 6001 --app-dir services/youtube

dev-searqon:
	@if [ -f "/home/sooriya/Documents/Searqon/bin/searqon" ]; then \
		echo "Starting Searqon on port 4001..."; \
		(cd /home/sooriya/Documents/Searqon && ./bin/searqon); \
	else \
		echo "Searqon binary not found at /home/sooriya/Documents/Searqon/bin/searqon"; \
	fi

dev:
	@echo "Cleaning up stale ports (5000, 6001)..."
	@fuser -k 5000/tcp 6001/tcp 2>/dev/null || true
	@echo "Starting Go server, Vite UI, and YouTube microservice..."
	@trap 'kill 0' EXIT; \
	($(PYTHON_BIN) -m uvicorn main:app --port 6001 --app-dir services/youtube) & \
	go run $(SERVER_MAIN) & \
	(cd $(UI_DIR) && npm run dev) & \
	wait

dev-all:
	@echo "Cleaning up stale ports (5000, 6001, 4001)..."
	@fuser -k 5000/tcp 6001/tcp 4001/tcp 2>/dev/null || true
	@echo "Starting Searqon, YouTube microservice, Go server, and Vite UI..."
	@trap 'kill 0' EXIT; \
	(if [ -f "/home/sooriya/Documents/Searqon/bin/searqon" ]; then cd /home/sooriya/Documents/Searqon && ./bin/searqon; fi) & \
	($(PYTHON_BIN) -m uvicorn main:app --port 6001 --app-dir services/youtube) & \
	go run $(SERVER_MAIN) & \
	(cd $(UI_DIR) && npm run dev) & \
	wait

status:
	@echo "Service Health Status:"
	@printf "  %-22s " "SourceBook (5000):"
	@curl -4 -s -o /dev/null -w "%{http_code}\n" http://localhost:5000/health 2>/dev/null | grep -q "200" && echo "ONLINE (200 OK)" || echo "OFFLINE"
	@printf "  %-22s " "Vite UI (3000):"
	@curl -4 -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/ 2>/dev/null | grep -q "200" && echo "ONLINE (200 OK)" || echo "OFFLINE"
	@printf "  %-22s " "YouTube (6001):"
	@curl -4 -s -o /dev/null -w "%{http_code}\n" http://localhost:6001/health 2>/dev/null | grep -q "200" && echo "ONLINE (200 OK)" || echo "OFFLINE"
	@printf "  %-22s " "Searqon (4001):"
	@curl -4 -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4001/health 2>/dev/null | grep -q "200" && echo "ONLINE (200 OK)" || echo "OFFLINE"
	@printf "  %-22s " "SearXNG (8080):"
	@curl -4 -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/ 2>/dev/null | grep -q -E "200|302" && echo "ONLINE" || echo "OFFLINE"
	@printf "  %-22s " "Document (4002):"
	@curl -4 -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4002/health 2>/dev/null | grep -q "200" && echo "ONLINE (200 OK)" || echo "OFFLINE"
	@printf "  %-22s " "Jina (4003):"
	@curl -4 -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4003/health 2>/dev/null | grep -q "200" && echo "ONLINE (200 OK)" || echo "OFFLINE"
	@printf "  %-22s " "Reddit (4004):"
	@curl -4 -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4004/health 2>/dev/null | grep -q "200" && echo "ONLINE (200 OK)" || echo "OFFLINE"
	@printf "  %-22s " "Social (4005):"
	@curl -4 -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4005/health 2>/dev/null | grep -q "200" && echo "ONLINE (200 OK)" || echo "OFFLINE"

stop:
	@echo "Stopping SourceBook services on ports 5000, 6001, 3000, 4001, 4002, 4003, 4004, 4005..."
	@fuser -k 5000/tcp 6001/tcp 3000/tcp 4001/tcp 4002/tcp 4003/tcp 4004/tcp 4005/tcp 2>/dev/null || true
	@echo "Done."

restart: stop dev

test:
	go test -v ./...

lines:
	@echo "Verifying all source files are strictly under 200 lines..."
	@python3 -c 'import os, sys; violations = [(sum(1 for _ in open(os.path.join(r, f), errors="ignore")), os.path.join(r, f)) for r, d, files in os.walk(".") if not any(p in r for p in [".venv", "venv", "node_modules", ".git", "dist", "bin", "others"]) for f in files if f.endswith((".go", ".jsx", ".js")) and not f.endswith("_test.go")]; [print(f"  {c} lines: {p}") for c, p in violations if c > 200]; sys.exit(1 if any(c > 200 for c, p in violations) else 0) if violations else None; print("All source files strictly adhere to the <200 lines rule.")'

check: test lines

# Container Orchestration (Defaults to Podman locally, supports Docker in CI)
podman-build compose-build docker-build:
	$(COMPOSE_CMD) build

podman-up compose-up docker-up:
	$(COMPOSE_CMD) up -d

podman-down compose-down docker-down:
	$(COMPOSE_CMD) down

clean:
	@echo "Cleaning artifacts..."
	rm -rf $(BINARY_DIR)
	rm -rf $(UI_DIR)/dist
	@echo "Clean completed."
