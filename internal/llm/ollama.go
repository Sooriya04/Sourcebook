package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func (c *Client) generateOllamaStream(ctx context.Context, messages []Message, onToken func(string) error) error {
	_, baseURL, model, _ := c.GetConfig()
	reqURL := fmt.Sprintf("%s/api/chat", baseURL)

	bodyData := map[string]interface{}{
		"model":    model,
		"messages": messages,
		"stream":   true,
		"options": map[string]interface{}{
			"num_ctx": 4096,
		},
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

func (c *Client) generateOllama(ctx context.Context, messages []Message) (string, error) {
	_, baseURL, model, _ := c.GetConfig()
	reqURL := fmt.Sprintf("%s/api/chat", baseURL)

	bodyData := map[string]interface{}{
		"model":    model,
		"messages": messages,
		"stream":   false,
		"options": map[string]interface{}{
			"num_ctx": 4096,
		},
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
