package llm

import (
	"testing"
)

func TestParseAPIError_JSONNestedMessage(t *testing.T) {
	resp := []byte(`{"error":{"message":"No active credentials for provider: antigravity","type":"invalid_request_error","code":"model_not_found"}}`)
	err := parseAPIError("openai", 404, resp)
	expected := "openai returned status 404: No active credentials for provider: antigravity"
	if err.Error() != expected {
		t.Fatalf("expected %q, got %q", expected, err.Error())
	}
}

func TestParseAPIError_JSONStringError(t *testing.T) {
	resp := []byte(`{"error":"model not found"}`)
	err := parseAPIError("ollama", 404, resp)
	expected := "ollama returned status 404: model not found"
	if err.Error() != expected {
		t.Fatalf("expected %q, got %q", expected, err.Error())
	}
}

func TestParseAPIError_JSONDirectMessage(t *testing.T) {
	resp := []byte(`{"message":"unauthorized access"}`)
	err := parseAPIError("gemini", 401, resp)
	expected := "gemini returned status 401: unauthorized access"
	if err.Error() != expected {
		t.Fatalf("expected %q, got %q", expected, err.Error())
	}
}

func TestParseAPIError_PlainText(t *testing.T) {
	resp := []byte(`Service Unavailable`)
	err := parseAPIError("groq", 503, resp)
	expected := "groq returned status 503: Service Unavailable"
	if err.Error() != expected {
		t.Fatalf("expected %q, got %q", expected, err.Error())
	}
}

func TestParseAPIError_GeminiArrayError(t *testing.T) {
	resp := []byte(`[{"error":{"code":503,"message":"This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.","status":"UNAVAILABLE"}}]`)
	err := parseAPIError("gemini", 503, resp)
	expected := "gemini returned status 503: This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later."
	if err.Error() != expected {
		t.Fatalf("expected %q, got %q", expected, err.Error())
	}
}

func TestParseAPIError_FastAPIDetail(t *testing.T) {
	resp := []byte(`{"detail":"Not authenticated"}`)
	err := parseAPIError("custom", 401, resp)
	expected := "custom returned status 401: Not authenticated"
	if err.Error() != expected {
		t.Fatalf("expected %q, got %q", expected, err.Error())
	}
}
