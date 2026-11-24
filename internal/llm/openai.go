package llm

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

func (c *Client) generateOpenAIStream(ctx context.Context, messages []Message, onToken func(string) error) error {
	_, baseURL, model, apiKey := c.GetConfig()
	reqURL := fmt.Sprintf("%s/chat/completions", baseURL)

	bodyData := map[string]interface{}{
		"model":    model,
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
	if apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+apiKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("%s stream request failed: %w", c.provider, err)
	}

	// Retry once on transient 503 (high demand) or 429 (rate spike) if context permits
	if resp.StatusCode == http.StatusServiceUnavailable || resp.StatusCode == http.StatusTooManyRequests {
		respBytes, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		select {
		case <-ctx.Done():
			return parseAPIError(c.provider, resp.StatusCode, respBytes)
		case <-time.After(1 * time.Second):
		}

		reqRetry, errRetry := http.NewRequestWithContext(ctx, "POST", reqURL, bytes.NewBuffer(jsonBytes))
		if errRetry == nil {
			reqRetry.Header.Set("Content-Type", "application/json")
			if apiKey != "" {
				reqRetry.Header.Set("Authorization", "Bearer "+apiKey)
			}
			if respRetry, errDo := c.httpClient.Do(reqRetry); errDo == nil {
				resp = respRetry
			} else {
				return parseAPIError(c.provider, resp.StatusCode, respBytes)
			}
		}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBytes, _ := io.ReadAll(resp.Body)
		return parseAPIError(c.provider, resp.StatusCode, respBytes)
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
		if line == "" || !strings.HasPrefix(line, "data: ") {
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

func (c *Client) generateOpenAI(ctx context.Context, messages []Message) (string, error) {
	_, baseURL, model, apiKey := c.GetConfig()
	reqURL := fmt.Sprintf("%s/chat/completions", baseURL)

	bodyData := map[string]interface{}{
		"model":    model,
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
	if apiKey != "" {
		req.Header.Set("Authorization", "Bearer "+apiKey)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return "", fmt.Errorf("%s request failed: %w", c.provider, err)
	}

	// Retry once on transient 503 (high demand) or 429 (rate spike) if context permits
	if resp.StatusCode == http.StatusServiceUnavailable || resp.StatusCode == http.StatusTooManyRequests {
		respBytes, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		select {
		case <-ctx.Done():
			return "", parseAPIError(c.provider, resp.StatusCode, respBytes)
		case <-time.After(1 * time.Second):
		}

		reqRetry, errRetry := http.NewRequestWithContext(ctx, "POST", reqURL, bytes.NewBuffer(jsonBytes))
		if errRetry == nil {
			reqRetry.Header.Set("Content-Type", "application/json")
			if apiKey != "" {
				reqRetry.Header.Set("Authorization", "Bearer "+apiKey)
			}
			if respRetry, errDo := c.httpClient.Do(reqRetry); errDo == nil {
				resp = respRetry
			} else {
				return "", parseAPIError(c.provider, resp.StatusCode, respBytes)
			}
		}
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		respBytes, _ := io.ReadAll(resp.Body)
		return "", parseAPIError(c.provider, resp.StatusCode, respBytes)
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %w", err)
	}

	// 1. Try standard OpenAI non-streaming JSON
	var res struct {
		Choices []struct {
			Message Message `json:"message"`
		} `json:"choices"`
	}
	if err := json.Unmarshal(bodyBytes, &res); err == nil && len(res.Choices) > 0 {
		return res.Choices[0].Message.Content, nil
	}

	// 2. Fallback: If proxy returns SSE stream ("data: {...}")
	var fullText strings.Builder
	lines := strings.Split(string(bodyBytes), "\n")
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if strings.HasPrefix(line, "data: ") {
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
			if err := json.Unmarshal([]byte(dataStr), &chunk); err == nil && len(chunk.Choices) > 0 {
				fullText.WriteString(chunk.Choices[0].Delta.Content)
			}
		}
	}

	if fullText.Len() > 0 {
		return fullText.String(), nil
	}

	return "", fmt.Errorf("failed to parse response from LLM endpoint")
}
