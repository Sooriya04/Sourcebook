package main

import (
	"log"
	"net/http"
	"os"

	"sourcebook/internal/api"
	"sourcebook/internal/controller"
	"sourcebook/internal/pipeline"
	"sourcebook/internal/providers/searx"
	"sourcebook/internal/registry"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment configuration.
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found or error reading it, using system environment variables")
	}

	// Wire the provider registry.
	reg := registry.NewProviderRegistry()

	// Initialize the primary search provider.
	searxURL := os.Getenv("SEARXNG_URL")
	if searxURL == "" {
		searxURL = "http://localhost:8080"
	}

	searxProvider := searx.NewSearXNGProvider(searxURL)
	reg.Register(searxProvider)

	// Wire the unified search controller and pipeline store.
	searchController := controller.NewUnifiedSearchController(reg)
	pipelineStore := pipeline.NewStore()

	// Wire the HTTP API.
	apiHandler := api.NewAPI(searchController, searxProvider, pipelineStore)

	// Register routes.
	mux := http.NewServeMux()
	mux.HandleFunc("/api/sourcebook/v1/search", apiHandler.HandleSearch)
	mux.HandleFunc("/api/sourcebook/v1/pipeline", apiHandler.HandlePipeline)
	mux.HandleFunc("/api/sourcebook/v1/chat", apiHandler.HandleChat)
	mux.HandleFunc("/api/sourcebook/v1/jobs/", apiHandler.HandleJob)

	// Health endpoint.
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	log.Printf("Starting SourceBook V1 server on port %s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
