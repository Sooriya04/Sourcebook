package vector

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

// Client coordinates embedding generation via microservice with subprocess fallback.
type Client struct {
	serviceURL string
	model      string
	httpClient *http.Client
	mu         sync.Mutex
}

// ChunkResponse represents a single chunk and its embedding.
type ChunkResponse struct {
	Chunk     string    `json:"chunk"`
	Embedding []float32 `json:"embedding"`
}

type embedMicroserviceRequest struct {
	Texts []string `json:"texts"`
}

type embedMicroserviceResponse struct {
	Embeddings [][]float32 `json:"embeddings"`
	Dimension  int         `json:"dimension"`
	Error      string      `json:"error"`
}

// NewClient initializes an embedding client with connection pooling.
func NewClient() *Client {
	url := os.Getenv("EMBEDDING_SERVICE_URL")
	if url == "" {
		url = "http://localhost:6002"
	}
	model := os.Getenv("EMBEDDING_MODEL")
	if model == "" {
		model = "all-MiniLM-L6-v2"
	}

	transport := &http.Transport{
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 25,
		IdleConnTimeout:     90 * time.Second,
	}

	return &Client{
		serviceURL: url,
		model:      model,
		httpClient: &http.Client{
			Timeout:   5 * time.Second,
			Transport: transport,
		},
	}
}

// SetConfig dynamically updates the embedding endpoint and model.
func (c *Client) SetConfig(url, model string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if url != "" {
		c.serviceURL = url
	}
	if model != "" {
		c.model = model
	}
}

// GenerateEmbeddings chunks raw text and generates dense vector embeddings.
func (c *Client) GenerateEmbeddings(ctx context.Context, text string) ([]ChunkResponse, error) {
	chunks := ChunkText(text, 500)
	if len(chunks) == 0 {
		return nil, nil
	}

	embeddings, err := c.GenerateBatchEmbeddings(ctx, chunks)
	if err != nil {
		return nil, err
	}

	results := make([]ChunkResponse, len(chunks))
	for i, chunk := range chunks {
		results[i] = ChunkResponse{
			Chunk:     chunk,
			Embedding: embeddings[i],
		}
	}
	return results, nil
}

// GenerateQueryEmbedding generates an embedding vector for a single query text.
func (c *Client) GenerateQueryEmbedding(ctx context.Context, query string) ([]float32, error) {
	results, err := c.GenerateBatchEmbeddings(ctx, []string{query})
	if err != nil {
		return nil, err
	}
	if len(results) == 0 {
		return nil, fmt.Errorf("empty embedding returned")
	}
	return results[0], nil
}

// GenerateBatchEmbeddings queries the microservice, falling back to local python subprocess.
func (c *Client) GenerateBatchEmbeddings(ctx context.Context, texts []string) ([][]float32, error) {
	if len(texts) == 0 {
		return nil, nil
	}

	// 1. Try microservice via HTTP
	embeddings, err := c.callMicroservice(ctx, texts)
	if err == nil && len(embeddings) == len(texts) {
		return embeddings, nil
	}

	// 2. Microservice unavailable or errored — fallback to local Python subprocess
	log.Printf("[Vector] Microservice at %s unavailable (%v), falling back to Python subprocess...", c.serviceURL, err)
	return RunEmbeddingSubprocess(ctx, texts)
}

func (c *Client) callMicroservice(ctx context.Context, texts []string) ([][]float32, error) {
	reqBody, err := json.Marshal(embedMicroserviceRequest{Texts: texts})
	if err != nil {
		return nil, err
	}

	endpoint := fmt.Sprintf("%s/embed", strings.TrimRight(c.serviceURL, "/"))
	req, err := http.NewRequestWithContext(ctx, "POST", endpoint, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("microservice returned HTTP %d", resp.StatusCode)
	}

	var res embedMicroserviceResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, err
	}
	if res.Error != "" {
		return nil, fmt.Errorf("microservice error: %s", res.Error)
	}

	return res.Embeddings, nil
}
