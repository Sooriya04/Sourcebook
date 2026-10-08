package vector

import (
	"context"
	"net/http"
	"net/http/httptest"
	"sync"
	"testing"
	"time"
)

func TestClient_SubprocessFallback(t *testing.T) {
	// Point to unreachable port to force subprocess fallback
	client := NewClient()
	client.SetConfig("http://localhost:59999", "all-MiniLM-L6-v2")

	ctx, cancel := context.WithTimeout(context.Background(), 25*time.Second)
	defer cancel()

	emb, err := client.GenerateQueryEmbedding(ctx, "Test query for fallback")
	if err != nil {
		t.Fatalf("GenerateQueryEmbedding via subprocess failed: %v", err)
	}
	if len(emb) != 384 {
		t.Fatalf("Expected embedding length 384, got %d", len(emb))
	}
}

func TestClient_ConcurrentSubprocessAccess(t *testing.T) {
	// Test 8 concurrent callers hitting the bounded subprocess pool
	client := NewClient()
	client.SetConfig("http://localhost:59999", "all-MiniLM-L6-v2")

	ctx, cancel := context.WithTimeout(context.Background(), 40*time.Second)
	defer cancel()

	var wg sync.WaitGroup
	errCh := make(chan error, 8)

	for i := 0; i < 8; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			emb, err := client.GenerateQueryEmbedding(ctx, "Concurrent embedding test query")
			if err != nil {
				errCh <- err
				return
			}
			if len(emb) != 384 {
				t.Errorf("Worker %d expected 384 dim, got %d", id, len(emb))
			}
		}(i)
	}

	wg.Wait()
	close(errCh)

	for err := range errCh {
		t.Fatalf("Concurrent worker failed: %v", err)
	}
}

func TestClient_MicroserviceHTTP(t *testing.T) {
	// Mock microservice HTTP server
	mockServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		mockEmbs := [][]float32{make([]float32, 384)}
		w.Write([]byte(`{"embeddings": [[0.1, 0.2]], "dimension": 384}`))
		_ = mockEmbs
	}))
	defer mockServer.Close()

	client := NewClient()
	client.SetConfig(mockServer.URL, "all-MiniLM-L6-v2")

	res, err := client.GenerateBatchEmbeddings(context.Background(), []string{"test text"})
	if err != nil {
		t.Fatalf("GenerateBatchEmbeddings failed: %v", err)
	}
	if len(res) != 1 || len(res[0]) != 2 {
		t.Fatalf("Unexpected mock response: %v", res)
	}
}
