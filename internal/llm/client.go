package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type Client struct {
	provider string
	baseURL  string
	model    string
	apiKey   string
	httpClient *http.Client
}

func NewClient() *Client {
	provider := os.Getenv("LLM_PROVIDER")
	if provider == "" {
		provider = "ollama"
	}

	baseURL := os.Getenv("LLM_URL")
	if baseURL == "" {
		if provider == "openai" {
			baseURL = "https://api.openai.com/v1"
		} else {
			baseURL = "http://localhost:11434"
		}
	}

	model := os.Getenv("LLM_MODEL")
	if model == "" {
		if provider == "openai" {
			model = "gpt-4o-mini"
		} else {
			model = "gemma2"
		}
	}

	return &Client{
		provider: provider,
		baseURL:  baseURL,
		model:    model,
		apiKey:   os.Getenv("LLM_API_KEY"),
		httpClient: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

func (c *Client) Generate(ctx context.Context, messages []Message) (string, error) {
	if c.provider == "openai" {
		return c.generateOpenAI(ctx, messages)
	}
	return c.generateOllama(ctx, messages)
}

func (c *Client) generateOllama(ctx context.Context, messages []Message) (string, error) {
	reqURL := fmt.Sprintf("%s/api/chat", c.baseURL)

	bodyData := map[string]interface{}{
		"model":    c.model,
		"messages": messages,
		"stream":   false,
	}

	jsonBytes, err := json.Marshal(bodyData)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", reqURL, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("ollama request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("ollama returned status %d: %s", resp.StatusCode, string(respBytes))
	}

	var res struct {
		Message Message `json:"message"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return "", fmt.Errorf("failed to decode ollama response: %w", err)
	}

	return res.Message.Content, nil
}

func (c *Client) generateOpenAI(ctx context.Context, messages []Message) (string, error) {
	reqURL := fmt.Sprintf("%s/chat/completions", c.baseURL)

	bodyData := map[string]interface{}{
		"model":    c.model,
		"messages": messages,
	}

	jsonBytes, err := json.Marshal(bodyData)
	if err != nil {
		return "", err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", reqURL, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	if c.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+c.apiKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("openai request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBytes, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("openai returned status %d: %s", resp.StatusCode, string(respBytes))
	}

	var res struct {
		Choices []struct {
			Message Message `json:"message"`
		} `json:"choices"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return "", fmt.Errorf("failed to decode openai response: %w", err)
	}

	if len(res.Choices) == 0 {
		return "", fmt.Errorf("openai returned empty choices")
	}

	return res.Choices[0].Message.Content, nil
}
