package llm

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

type Client struct {
	provider   string
	baseURL    string
	model      string
	apiKey     string
	httpClient *http.Client
}

func NewClient() *Client {
	provider := os.Getenv("LLM_PROVIDER")
	if provider == "" {
		log.Fatalf("LLM_PROVIDER environment variable is not set")
	}

	baseURL := os.Getenv("LLM_URL")
	if baseURL == "" {
		log.Fatalf("LLM_URL environment variable is not set")
	}

	model := os.Getenv("LLM_MODEL")
	if model == "" {
		log.Fatalf("LLM_MODEL environment variable is not set")
	}

	return &Client{
		provider: provider,
		baseURL:  baseURL,
		model:    model,
		apiKey:   os.Getenv("LLM_API_KEY"),
		httpClient: &http.Client{
			Timeout: 120 * time.Second,
		},
	}
}

func (c *Client) Generate(ctx context.Context, messages []Message) (string, error) {
	if c.provider == "openai" {
		return c.generateOpenAI(ctx, messages)
	}
	return c.generateOllama(ctx, messages)
}

func (c *Client) GenerateStream(ctx context.Context, messages []Message, onToken func(string) error) error {
	if c.provider == "openai" {
		return c.generateOpenAIStream(ctx, messages, onToken)
	}
	return c.generateOllamaStream(ctx, messages, onToken)
}

func (c *Client) generateOllamaStream(ctx context.Context, messages []Message, onToken func(string) error) error {
	reqURL := fmt.Sprintf("%s/api/chat", c.baseURL)

	bodyData := map[string]interface{}{
		"model":    c.model,
		"messages": messages,
		"stream":   true,
	}

	jsonBytes, err := json.Marshal(bodyData)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", reqURL, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("ollama stream request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("ollama returned status %d: %s", resp.StatusCode, string(respBytes))
	}

	decoder := json.NewDecoder(resp.Body)
	for {
		var chunk struct {
			Message Message `json:"message"`
			Done    bool    `json:"done"`
		}
		if err := decoder.Decode(&chunk); err != nil {
			if err == io.EOF {
				break
			}
			return fmt.Errorf("error decoding ollama stream: %w", err)
		}
		if chunk.Message.Content != "" {
			if err := onToken(chunk.Message.Content); err != nil {
				return err
			}
		}
		if chunk.Done {
			break
		}
	}
	return nil
}

func (c *Client) generateOpenAIStream(ctx context.Context, messages []Message, onToken func(string) error) error {
	reqURL := fmt.Sprintf("%s/chat/completions", c.baseURL)

	bodyData := map[string]interface{}{
		"model":    c.model,
		"messages": messages,
		"stream":   true,
	}

	jsonBytes, err := json.Marshal(bodyData)
	if err != nil {
		return err
	}

	req, err := http.NewRequestWithContext(ctx, "POST", reqURL, bytes.NewBuffer(jsonBytes))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	if c.apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+c.apiKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("openai stream request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("openai returned status %d: %s", resp.StatusCode, string(respBytes))
	}

	reader := bufio.NewReader(resp.Body)
	for {
		line, err := reader.ReadString('\n')
		if err != nil {
			if err == io.EOF {
				break
			}
			return err
		}
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		if !strings.HasPrefix(line, "data: ") {
			continue
		}
		dataStr := strings.TrimPrefix(line, "data: ")
		if dataStr == "[DONE]" {
			break
		}
		var chunk struct {
			Choices []struct {
				Delta struct {
					Content string `json:"content"`
				} `json:"delta"`
			} `json:"choices"`
		}
		if err := json.Unmarshal([]byte(dataStr), &chunk); err != nil {
			continue
		}
		if len(chunk.Choices) > 0 && chunk.Choices[0].Delta.Content != "" {
			if err := onToken(chunk.Choices[0].Delta.Content); err != nil {
				return err
			}
		}
	}
	return nil
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
