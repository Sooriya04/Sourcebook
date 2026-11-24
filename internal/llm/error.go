package llm

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

// parseAPIError extracts clean, human-readable error messages from provider responses.
func parseAPIError(provider string, statusCode int, respBytes []byte) error {
	cleanMsg := ""

	var raw any
	if err := json.Unmarshal(respBytes, &raw); err == nil {
		cleanMsg = extractErrorMessage(raw)
	}

	if cleanMsg == "" {
		cleanMsg = strings.TrimSpace(string(respBytes))
		if cleanMsg == "" {
			cleanMsg = http.StatusText(statusCode)
		}
	}

	return fmt.Errorf("%s returned status %d: %s", provider, statusCode, cleanMsg)
}

func extractErrorMessage(v any) string {
	switch val := v.(type) {
	case string:
		return strings.TrimSpace(val)
	case map[string]any:
		// Check "error" field first
		if errVal, ok := val["error"]; ok {
			if m := extractErrorMessage(errVal); m != "" {
				return m
			}
		}
		// Check "message" field
		if msgVal, ok := val["message"]; ok {
			if m := extractErrorMessage(msgVal); m != "" {
				return m
			}
		}
		// Check "detail" field (common in Python/FastAPI backends)
		if detVal, ok := val["detail"]; ok {
			if m := extractErrorMessage(detVal); m != "" {
				return m
			}
		}
	case []any:
		for _, item := range val {
			if m := extractErrorMessage(item); m != "" {
				return m
			}
		}
	}
	return ""
}
