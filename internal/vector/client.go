package vector

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

// Client handles HTTP requests to the Python embedding service.
type Client struct {
	baseURL    string
	httpClient *http.Client
}

// ChunkResponse represents a single chunk and its embedding returned from the python service.
type ChunkResponse struct {
	Chunk     string    `json:"chunk"`
	Embedding []float32 `json:"embedding"`
}

// QueryResponse represents a query embedding vector returned from the python service.
type QueryResponse struct {
	Embedding []float32 `json:"embedding"`
}

// NewClient initializes a new client for the embedding service.
func NewClient() *Client {
	url := os.Getenv("EMBEDDING_SERVICE_URL")
	if url == "" {
		log.Fatalf("EMBEDDING_SERVICE_URL environment variable is required")
	}
	return &Client{
		baseURL: url,
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// GenerateEmbeddings chunks the raw text and generates vector embeddings.
func (c *Client) GenerateEmbeddings(ctx context.Context, text string) ([]ChunkResponse, error) {
	reqBody, err := json.Marshal(map[string]string{"text": text})
	if err != nil {
		return nil, fmt.Errorf("failed to marshal generate request: %w", err)
	}

	reqURL := fmt.Sprintf("%s/api/sourcebook/v1/embeddings/generate", c.baseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", reqURL, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to reach embedding service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("embedding service returned status: %s", resp.Status)
	}

	var chunks []ChunkResponse
	if err := json.NewDecoder(resp.Body).Decode(&chunks); err != nil {
		return nil, fmt.Errorf("failed to decode response: %w", err)
	}

	return chunks, nil
}

// GenerateQueryEmbedding gets a single vector representation for a query.
func (c *Client) GenerateQueryEmbedding(ctx context.Context, query string) ([]float32, error) {
	reqBody, err := json.Marshal(map[string]string{"query": query})
	if err != nil {
		return nil, fmt.Errorf("failed to marshal query request: %w", err)
	}

	reqURL := fmt.Sprintf("%s/api/sourcebook/v1/embeddings/query", c.baseURL)
	req, err := http.NewRequestWithContext(ctx, "POST", reqURL, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create query request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to reach embedding service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("embedding service returned status: %s", resp.Status)
	}

	var res QueryResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, fmt.Errorf("failed to decode query response: %w", err)
	}

	return res.Embedding, nil
}
