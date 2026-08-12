package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"
)

type ScrapeRequest struct {
	URL  string   `json:"url,omitempty"`
	URLs []string `json:"urls,omitempty"`
}

type ScrapeResult struct {
	URL      string `json:"url"`
	Title    string `json:"title"`
	Markdown string `json:"markdown"`
	Success  bool   `json:"success"`
	Error    string `json:"error,omitempty"`
}

type BatchResponse struct {
	Success bool           `json:"success"`
	Data    []ScrapeResult `json:"data"`
}

func enableCORS(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
		w.Header().Set("Access-Control-Allow-Headers", "Content-Type")

		if r.Method == "OPTIONS" {
			w.WriteHeader(http.StatusOK)
			return
		}

		next(w, r)
	}
}

func scrapeURL(r *http.Request, targetURL string) (string, string, error) {
	if isFeedURL(targetURL) {
		return scrapeFeedURL(r.Context(), targetURL)
	}
	return scrapeSocialMediaURL(r.Context(), targetURL)
}

func handleScrapeBatch(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req ScrapeRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	urls := req.URLs
	if req.URL != "" {
		urls = append(urls, req.URL)
	}

	if len(urls) == 0 {
		http.Error(w, "URLs are required", http.StatusBadRequest)
		return
	}

	var results []ScrapeResult
	var mu sync.Mutex
	var wg sync.WaitGroup

	for _, u := range urls {
		wg.Add(1)
		go func(targetURL string) {
			defer wg.Done()
			title, md, err := scrapeURL(r, targetURL)

			res := ScrapeResult{
				URL: targetURL,
			}
			if err != nil {
				res.Success = false
				res.Error = err.Error()
			} else {
				res.Success = true
				res.Title = title
				res.Markdown = md
			}

			mu.Lock()
			results = append(results, res)
			mu.Unlock()
		}(u)
	}

	wg.Wait()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(BatchResponse{
		Success: true,
		Data:    results,
	})
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/scrape/batch", enableCORS(handleScrapeBatch))
	mux.HandleFunc("/health", enableCORS(handleHealth))

	port := os.Getenv("PORT")
	if port == "" {
		port = "4005"
	}
	log.Printf("Starting Social Ingestion Microservice on port %s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
