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

// DefaultBaseURL returns the standard base URL for the given provider.
func DefaultBaseURL(provider string) string {
	switch strings.ToLower(strings.TrimSpace(provider)) {
	case "ollama":
		return "http://localhost:11434"
	case "lmstudio":
		return "http://localhost:1234/v1"
	case "localai":
		return "http://localhost:8080/v1"
	case "vllm":
		return "http://localhost:8000/v1"
	case "gemini":
		return "https://generativelanguage.googleapis.com/v1beta/openai"
	case "groq":
		return "https://api.groq.com/openai/v1"
	case "openrouter":
		return "https://openrouter.ai/api/v1"
	case "deepseek":
		return "https://api.deepseek.com/v1"
	case "nvidia":
		return "https://integrate.api.nvidia.com/v1"
	case "anthropic":
		return "https://api.anthropic.com/v1"
	case "openai":
		return "https://api.openai.com/v1"
	default:
		return "https://api.openai.com/v1"
	}
}

// DefaultModel returns a reasonable default model identifier for the given provider.
func DefaultModel(provider string) string {
	switch strings.ToLower(strings.TrimSpace(provider)) {
	case "gemini":
		return "gemini-1.5-flash"
	case "groq":
		return "llama-3.3-70b-versatile"
	case "openrouter":
		return "meta-llama/llama-3.3-70b-instruct"
	case "deepseek":
		return "deepseek-chat"
	case "nvidia":
		return "meta/llama-3.1-70b-instruct"
	case "anthropic":
		return "claude-3-5-sonnet-20241022"
	case "lmstudio":
		return "local-model"
	case "localai":
		return "gpt-4"
	case "vllm":
		return "mistralai/Mistral-7B-Instruct-v0.2"
	case "openai":
		return "gpt-4o-mini"
	case "ollama":
		return "gemma2"
	default:
		return "gemma2"
	}
}

func NewClient() *Client {
	provider := strings.TrimSpace(os.Getenv("LLM_PROVIDER"))
	if provider == "" {
		provider = "ollama"
	}

	baseURL := strings.TrimSpace(os.Getenv("LLM_URL"))
	if baseURL == "" {
		baseURL = DefaultBaseURL(provider)
	}

	model := strings.TrimSpace(os.Getenv("LLM_MODEL"))
	if model == "" {
		model = DefaultModel(provider)
	}

	return NewClientWithConfig(provider, baseURL, model, strings.TrimSpace(os.Getenv("LLM_API_KEY")))
}

// NewClientWithConfig creates an independent, thread-safe LLM client instance.
func NewClientWithConfig(provider, baseURL, model, apiKey string) *Client {
	provider = strings.TrimSpace(provider)
	if provider == "" {
		provider = "ollama"
	}
	baseURL = strings.TrimSpace(baseURL)
	if baseURL == "" {
		baseURL = DefaultBaseURL(provider)
	}
	model = strings.TrimSpace(model)
	if model == "" {
		model = DefaultModel(provider)
	}

	return &Client{
		provider: provider,
		baseURL:  strings.TrimSuffix(baseURL, "/"),
		model:    model,
		apiKey:   strings.TrimSpace(apiKey),
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

	providerTrimmed := strings.TrimSpace(provider)
	providerChanged := providerTrimmed != "" && !strings.EqualFold(c.provider, providerTrimmed)

	if providerTrimmed != "" {
		c.provider = providerTrimmed
	}
	if baseURL != "" {
		c.baseURL = strings.TrimSuffix(strings.TrimSpace(baseURL), "/")
	} else if providerChanged || c.baseURL == "" {
		c.baseURL = DefaultBaseURL(c.provider)
	}
	if model != "" {
		c.model = strings.TrimSpace(model)
	} else if providerChanged || c.model == "" {
		c.model = DefaultModel(c.provider)
	}
	if apiKey != "" {
		c.apiKey = strings.TrimSpace(apiKey)
	} else if providerChanged {
		if strings.ToLower(c.provider) == "ollama" {
			c.apiKey = ""
		}
	} else if strings.ToLower(c.provider) == "ollama" {
		c.apiKey = ""
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
