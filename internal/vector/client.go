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
	"time"
)

// Client handles HTTP requests to the Ollama embedding service.
type Client struct {
	llmURL     string
	model      string
	httpClient *http.Client
}

// ChunkResponse represents a single chunk and its embedding.
type ChunkResponse struct {
	Chunk     string    `json:"chunk"`
	Embedding []float32 `json:"embedding"`
}

type ollamaEmbedRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
}

type ollamaEmbedResponse struct {
	Embedding []float32 `json:"embedding"`
}

// NewClient initializes a new client for the embedding service.
func NewClient() *Client {
	url := os.Getenv("EMBEDDING_URL")
	if url == "" {
		url = os.Getenv("LLM_URL")
	}
	if url == "" {
		url = "http://localhost:11434"
	}
	model := os.Getenv("EMBEDDING_MODEL")
	if model == "" {
		model = "nomic-embed-text"
	}
	return &Client{
		llmURL: url,
		model:  model,
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

// GenerateEmbeddings chunks the raw text and generates vector embeddings via Ollama.
func (c *Client) GenerateEmbeddings(ctx context.Context, text string) ([]ChunkResponse, error) {
	chunks := chunkTextFallback(text, 500)
	var results []ChunkResponse

	for _, chunk := range chunks {
		emb, err := c.GenerateQueryEmbedding(ctx, chunk)
		if err != nil {
			log.Printf("[Vector] Failed to generate embedding for chunk: %v", err)
			continue
		}
		results = append(results, ChunkResponse{
			Chunk:     chunk,
			Embedding: emb,
		})
	}
	return results, nil
}

// GenerateQueryEmbedding gets a single vector representation for a query.
func (c *Client) GenerateQueryEmbedding(ctx context.Context, query string) ([]float32, error) {
	reqBody, err := json.Marshal(ollamaEmbedRequest{
		Model:  c.model,
		Prompt: query,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to marshal query request: %w", err)
	}

	reqURL := fmt.Sprintf("%s/api/embeddings", strings.TrimRight(c.llmURL, "/"))
	req, err := http.NewRequestWithContext(ctx, "POST", reqURL, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create query request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to reach Ollama embedding service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Ollama returned status: %s", resp.Status)
	}

	var res ollamaEmbedResponse
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return nil, fmt.Errorf("failed to decode query response: %w", err)
	}

	return res.Embedding, nil
}

// chunkTextFallback splits text into paragraphs and sentences to approximate chunkSize chars.
func chunkTextFallback(text string, chunkSize int) []string {
	paragraphs := strings.Split(text, "\n\n")
	var chunks []string
	currentChunk := ""

	for _, p := range paragraphs {
		p = strings.TrimSpace(p)
		if p == "" {
			continue
		}
		if len(currentChunk)+len(p)+2 <= chunkSize {
			if currentChunk != "" {
				currentChunk += "\n\n"
			}
			currentChunk += p
		} else {
			if currentChunk != "" {
				chunks = append(chunks, currentChunk)
			}
			if len(p) > chunkSize {
				// Too big, split by approximate sentence boundaries
				sentences := strings.Split(p, ". ")
				curr := ""
				for _, s := range sentences {
					if len(curr)+len(s)+1 <= chunkSize {
						if curr != "" {
							curr += ". "
						}
						curr += s
					} else {
						if curr != "" {
							chunks = append(chunks, curr)
						}
						curr = s
					}
				}
				currentChunk = curr
			} else {
				currentChunk = p
			}
		}
	}
	if currentChunk != "" {
		chunks = append(chunks, currentChunk)
	}
	return chunks
}
