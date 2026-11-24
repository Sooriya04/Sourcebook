package llm

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
)

func TestClient_ThreadSafety(t *testing.T) {
	client := NewClientWithConfig("ollama", "http://localhost:11434", "gemma2", "")

	var wg sync.WaitGroup
	// Concurrently read and update client settings to verify mutex synchronization
	for i := 0; i < 20; i++ {
		wg.Add(2)
		go func(idx int) {
			defer wg.Done()
			client.SetConfig(
				fmt.Sprintf("provider-%d", idx),
				fmt.Sprintf("http://localhost:%d", 10000+idx),
				fmt.Sprintf("model-%d", idx),
				fmt.Sprintf("key-%d", idx),
			)
		}(i)

		go func() {
			defer wg.Done()
			_, _, _, _ = client.GetConfig()
			_ = client.GetModel()
		}()
	}

	wg.Wait()
}

func TestClient_IsolatedTestConnection(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{
			"choices": [
				{
					"message": {
						"role": "assistant",
						"content": "pong"
					}
				}
			]
		}`))
	}))
	defer server.Close()

	testClient := NewClientWithConfig("openai", server.URL, "gpt-4o", "test-key")
	ok, res, err := testClient.TestConnection(context.Background())
	if !ok || err != nil {
		t.Fatalf("Expected successful test connection, got ok=%v, err=%v", ok, err)
	}
	if res != "pong" {
		t.Fatalf("Expected 'pong', got %q", res)
	}
}

func TestClient_GeminiDefaultConfig(t *testing.T) {
	client := NewClientWithConfig("gemini", "", "", "gemini-key")
	provider, baseURL, model, apiKey := client.GetConfig()
	if provider != "gemini" {
		t.Errorf("expected provider gemini, got %s", provider)
	}
	if baseURL != "https://generativelanguage.googleapis.com/v1beta/openai" {
		t.Errorf("expected gemini baseURL, got %s", baseURL)
	}
	if model != "gemini-1.5-flash" {
		t.Errorf("expected default model gemini-1.5-flash, got %s", model)
	}
	if apiKey != "gemini-key" {
		t.Errorf("expected apiKey gemini-key, got %s", apiKey)
	}
}

func TestClient_ProviderDefaults(t *testing.T) {
	tests := []struct {
		provider    string
		expectedURL string
		expectedMod string
	}{
		{"ollama", "http://localhost:11434", "gemma2"},
		{"gemini", "https://generativelanguage.googleapis.com/v1beta/openai", "gemini-1.5-flash"},
		{"groq", "https://api.groq.com/openai/v1", "llama-3.3-70b-versatile"},
		{"openrouter", "https://openrouter.ai/api/v1", "meta-llama/llama-3.3-70b-instruct"},
		{"deepseek", "https://api.deepseek.com/v1", "deepseek-chat"},
		{"openai", "https://api.openai.com/v1", "gpt-4o-mini"},
	}

	for _, tt := range tests {
		t.Run(tt.provider, func(t *testing.T) {
			c := NewClientWithConfig(tt.provider, "", "", "")
			p, u, m, _ := c.GetConfig()
			if p != tt.provider {
				t.Errorf("expected provider %s, got %s", tt.provider, p)
			}
			if u != tt.expectedURL {
				t.Errorf("[%s] expected url %s, got %s", tt.provider, tt.expectedURL, u)
			}
			if m != tt.expectedMod {
				t.Errorf("[%s] expected model %s, got %s", tt.provider, tt.expectedMod, m)
			}
		})
	}
}
