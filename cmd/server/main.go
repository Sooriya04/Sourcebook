package main

import (
	"log"
	"net/http"
	"os"

	"sourcebook/internal/api"
	"sourcebook/internal/controller"
	"sourcebook/internal/database"
	"sourcebook/internal/pipeline"
	"sourcebook/internal/providers/ddg"
	"sourcebook/internal/providers/searx"
	"sourcebook/internal/registry"

	"github.com/joho/godotenv"
)

func main() {
	// Load environment configuration.
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found or error reading it, using system environment variables")
	}

	// Initialize database
	db, err := database.InitDB("sourcebook.db")
	if err != nil {
		log.Fatalf("Failed to initialize database: %v", err)
	}
	defer db.Close()
	repo := database.NewRepository(db)

	// Wire the provider registry.
	reg := registry.NewProviderRegistry()

	// Initialize the primary search provider.
	searxURL := os.Getenv("SEARXNG_URL")
	if searxURL == "" {
		log.Fatalf("SEARXNG_URL environment variable is required")
	}

	searxProvider := searx.NewSearXNGProvider(searxURL)
	reg.Register(searxProvider)

	// Initialize the fallback search provider (DuckDuckGo).
	ddgProvider := ddg.NewDuckDuckGoProvider()
	reg.Register(ddgProvider)

	// Wire the unified search controller and pipeline store.
	searchController := controller.NewUnifiedSearchController(reg)
	pipelineStore := pipeline.NewStore()

	// Wire the HTTP API.
	apiHandler := api.NewAPI(searchController, ddgProvider, pipelineStore, repo)

	// Register routes.
	mux := http.NewServeMux()
	mux.HandleFunc("/api/sourcebook/v1/search", apiHandler.HandleSearch)
	mux.HandleFunc("/api/sourcebook/v1/discovery", apiHandler.HandleDiscovery) // New Searqon fast search
	mux.HandleFunc("/api/sourcebook/v1/pipeline", apiHandler.HandlePipeline)
	mux.HandleFunc("/api/sourcebook/v1/chat", apiHandler.HandleChat)
	mux.HandleFunc("/api/sourcebook/v1/youtube/transcript", apiHandler.HandleYouTubeTranscript)
	mux.HandleFunc("/api/sourcebook/v1/jobs/", apiHandler.HandleJob)
	mux.HandleFunc("/api/sourcebook/v1/notebooks", apiHandler.HandleNotebooks)
	mux.HandleFunc("/api/sourcebook/v1/notebooks/", apiHandler.HandleNotebooks)

	// Health endpoint.
	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	// Request logging & CORS middleware
	corsAndLoggingHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

		if r.Method == http.MethodOptions {
			w.WriteHeader(http.StatusOK)
			return
		}

		log.Printf("[HTTP] %s %s", r.Method, r.URL.Path)
		mux.ServeHTTP(w, r)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "5000"
	}

	log.Printf("Starting SourceBook V1 server on port %s", port)
	if err := http.ListenAndServe(":"+port, corsAndLoggingHandler); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
