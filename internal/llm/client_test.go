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
