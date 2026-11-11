package synthesis

import (
	"testing"

	"sourcebook/internal/llm"
)

func TestNewSynthesizer_SharedClient(t *testing.T) {
	client := llm.NewClientWithConfig("openai", "https://api.openai.com/v1", "gpt-4o", "secret-key")
	s := NewSynthesizer(client)

	if s.LLMClient() != client {
		t.Fatalf("expected synthesizer to use provided client pointer")
	}

	if s.LLMClient().GetModel() != "gpt-4o" {
		t.Fatalf("expected model to be gpt-4o, got %s", s.LLMClient().GetModel())
	}

	// Update client configuration (simulating user settings override)
	client.SetConfig("groq", "https://api.groq.com", "llama-3-70b", "groq-key")

	if s.LLMClient().GetModel() != "llama-3-70b" {
		t.Fatalf("expected synthesizer client model to reflect override llama-3-70b, got %s", s.LLMClient().GetModel())
	}
}

func TestNewSynthesizer_NilClientFallback(t *testing.T) {
	s := NewSynthesizer(nil)
	if s.LLMClient() == nil {
		t.Fatalf("expected synthesizer to create a fallback client when passed nil")
	}
}
