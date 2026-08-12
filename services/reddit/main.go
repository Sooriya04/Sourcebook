package main

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
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

func scrapeReddit(ctx context.Context, targetURL string) (string, string, error) {
	url := strings.TrimSpace(targetURL)
	if !strings.HasPrefix(url, "http://") && !strings.HasPrefix(url, "https://") {
		url = "https://" + url
	}

	// Clean/normalize Reddit URL and use rxddit.com/safereddit mirror for zero-config public read.
	// E.g., https://www.reddit.com/r/... -> https://rxddit.com/r/...
	mirrorURL := url
	if strings.Contains(url, "reddit.com") {
		mirrorURL = strings.Replace(url, "reddit.com", "rxddit.com", 1)
	} else if strings.Contains(url, "redd.it") {
		mirrorURL = strings.Replace(url, "redd.it", "rxddit.com", 1)
	}

	jinaURL := fmt.Sprintf("https://r.jina.ai/%s", mirrorURL)
	reqCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(reqCtx, "GET", jinaURL, nil)
	if err != nil {
		return "", "", err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
	req.Header.Set("Accept", "text/plain")

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		rawErr, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
		return "", "", fmt.Errorf("Reddit mirror fetch failed (HTTP %d): %s", resp.StatusCode, string(rawErr))
	}

	title := ""
	if tHeader := resp.Header.Get("X-Title"); tHeader != "" {
		title = tHeader
	} else {
		parts := strings.Split(url, "/")
		if len(parts) > 2 {
			title = parts[2]
		} else {
			title = url
		}
	}

	body, err := io.ReadAll(io.LimitReader(resp.Body, 10*1024*1024)) // 10MB limit
	if err != nil {
		return "", "", err
	}

	return title, string(body), nil
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
			title, md, err := scrapeReddit(r.Context(), targetURL)

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
		port = "4004"
	}
	log.Printf("Starting Reddit Ingestion Microservice on port %s", port)
	if err := http.ListenAndServe(":"+port, mux); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
