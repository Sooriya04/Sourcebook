package chat

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"sourcebook/internal/llm"
)

func TestAgentLoop_ArxivFetchFailurePreserved(t *testing.T) {
	callCount := 0
	var receivedHistories [][]llm.Message

	ts := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		callCount++
		var req struct {
			Messages []llm.Message `json:"messages"`
		}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			t.Errorf("failed to decode request: %v", err)
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}
		receivedHistories = append(receivedHistories, req.Messages)

		var assistantContent string
		if callCount == 1 {
			// Step 1: instruct agent to call fetch_arxiv with input containing control char so NewRequest fails
			assistantContent = `{"thought": "Fetch arXiv paper", "action": "fetch_arxiv", "action_input": "invalid\u007furl"}`
		} else {
			// Step 2: finish after observing the error
			assistantContent = `{"thought": "Handled tool failure, finishing", "action": "finish", "action_input": ""}`
		}

		resp := map[string]interface{}{
			"choices": []map[string]interface{}{
				{
					"message": map[string]string{
						"role":    "assistant",
						"content": assistantContent,
					},
				},
			},
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(resp)
	}))
	defer ts.Close()

	llmClient := llm.NewClientWithConfig("openai", ts.URL, "test-model", "test-key")

	agentLoop := &AgentLoop{
		evaluator: NewSelfEvaluator(nil),
		tools:     NewToolRegistry(nil),
		llmClient: llmClient,
		planner:   nil,
	}

	docs, tracer, err := agentLoop.Run(context.Background(), "test arxiv failure", "nb1", nil, nil)
	if err != nil {
		t.Fatalf("unexpected agent loop error: %v", err)
	}
	if len(docs) != 0 {
		t.Fatalf("expected 0 docs, got %d", len(docs))
	}

	// Verify tracer recorded StateExecuteTool with Tool error
	var foundErrorStep bool
	for _, step := range tracer.Traces {
		if step.State == StateExecuteTool && step.Action == "fetch_arxiv" {
			if strings.Contains(step.Thought, "Tool error:") {
				foundErrorStep = true
				break
			}
		}
	}
	if !foundErrorStep {
		t.Errorf("expected tracer to log Tool error for fetch_arxiv step, traces: %+v", tracer.Traces)
	}

	// Verify agentHistory passed to LLM in call 2 contains the tool error observation
	if len(receivedHistories) < 2 {
		t.Fatalf("expected at least 2 LLM calls, got %d", len(receivedHistories))
	}

	secondTurnMessages := receivedHistories[1]
	lastMsg := secondTurnMessages[len(secondTurnMessages)-1]
	if !strings.Contains(lastMsg.Content, "Observation: Tool failed with error:") {
		t.Errorf("expected last message in agentHistory to contain tool error observation, got: %s", lastMsg.Content)
	}
}
