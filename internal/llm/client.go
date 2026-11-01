package llm

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

type Client struct {
	mu         sync.RWMutex
	provider   string
	baseURL    string
	model      string
	apiKey     string
	httpClient *http.Client
}

func NewClient() *Client {
	provider := os.Getenv("LLM_PROVIDER")
	if provider == "" {
		provider = "ollama"
	}

	baseURL := os.Getenv("LLM_URL")
	if baseURL == "" {
		baseURL = "http://localhost:11434"
	}

	model := os.Getenv("LLM_MODEL")
	if model == "" {
		model = "gemma2"
	}

	return NewClientWithConfig(provider, baseURL, model, os.Getenv("LLM_API_KEY"))
}

// NewClientWithConfig creates an independent, thread-safe LLM client instance.
func NewClientWithConfig(provider, baseURL, model, apiKey string) *Client {
	if provider == "" {
		provider = "ollama"
	}
	if baseURL == "" {
		if provider == "ollama" {
			baseURL = "http://localhost:11434"
		} else {
			baseURL = "https://api.openai.com/v1"
		}
	}

	return &Client{
		provider: provider,
		baseURL:  strings.TrimSuffix(baseURL, "/"),
		model:    model,
		apiKey:   apiKey,
		httpClient: &http.Client{
			Timeout: 120 * time.Second,
		},
	}
}

func (c *Client) Generate(ctx context.Context, messages []Message) (string, error) {
	c.mu.RLock()
	provider := c.provider
	c.mu.RUnlock()

	if provider != "ollama" {
		return c.generateOpenAI(ctx, messages)
	}
	return c.generateOllama(ctx, messages)
}

func (c *Client) GenerateStream(ctx context.Context, messages []Message, onToken func(string) error) error {
	c.mu.RLock()
	provider := c.provider
	c.mu.RUnlock()

	if provider != "ollama" {
		return c.generateOpenAIStream(ctx, messages, onToken)
	}
	return c.generateOllamaStream(ctx, messages, onToken)
}

func (c *Client) SetModel(modelName string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	c.model = modelName
}

func (c *Client) GetModel() string {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.model
}

func (c *Client) SetConfig(provider, baseURL, model, apiKey string) {
	c.mu.Lock()
	defer c.mu.Unlock()
	if provider != "" {
		c.provider = provider
	}
	if baseURL != "" {
		c.baseURL = strings.TrimSuffix(baseURL, "/")
	}
	if model != "" {
		c.model = model
	}
	if apiKey != "" {
		c.apiKey = apiKey
	}
}

func (c *Client) GetConfig() (string, string, string, string) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.provider, c.baseURL, c.model, c.apiKey
}

// Ping quickly checks endpoint connectivity without triggering a full LLM token generation.
func (c *Client) Ping(ctx context.Context) (bool, error) {
	provider, baseURL, _, apiKey := c.GetConfig()

	if provider == "ollama" {
		reqURL := fmt.Sprintf("%s/api/tags", baseURL)
		req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
		if err != nil {
			return false, err
		}
		resp, err := c.httpClient.Do(req)
		if err != nil {
			return false, err
		}
		defer resp.Body.Close()
		return resp.StatusCode == http.StatusOK, nil
	}

	reqURL := fmt.Sprintf("%s/models", baseURL)
	req, err := http.NewRequestWithContext(ctx, "GET", reqURL, nil)
	if err == nil {
		if apiKey != "" {
			req.Header.Set("Authorization", "Bearer "+apiKey)
		}
		resp, err := c.httpClient.Do(req)
		if err == nil {
			defer resp.Body.Close()
			if resp.StatusCode == http.StatusOK {
				return true, nil
			}
		}
	}

	ok, _, err := c.TestConnection(ctx)
	return ok, err
}

// TestConnection validates if the configured model / API key / BaseURL is responsive.
func (c *Client) TestConnection(ctx context.Context) (bool, string, error) {
	testMsg := []Message{
		{Role: "user", Content: "ping"},
	}
	res, err := c.Generate(ctx, testMsg)
	if err != nil {
		return false, "", err
	}
	return true, res, nil
}
