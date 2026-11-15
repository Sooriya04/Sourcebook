package llm

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
)

// parseAPIError extracts clean, human-readable error messages from provider responses.
func parseAPIError(provider string, statusCode int, respBytes []byte) error {
	var errObj struct {
		Error   any    `json:"error"`
		Message string `json:"message"`
	}

	cleanMsg := ""
	if err := json.Unmarshal(respBytes, &errObj); err == nil {
		if msgMap, ok := errObj.Error.(map[string]interface{}); ok {
			if m, ok := msgMap["message"].(string); ok && m != "" {
				cleanMsg = m
			}
		} else if s, ok := errObj.Error.(string); ok && s != "" {
			cleanMsg = s
		}

		if cleanMsg == "" && errObj.Message != "" {
			cleanMsg = errObj.Message
		}
	}

	if cleanMsg == "" {
		cleanMsg = strings.TrimSpace(string(respBytes))
		if cleanMsg == "" {
			cleanMsg = http.StatusText(statusCode)
		}
	}

	return fmt.Errorf("%s returned status %d: %s", provider, statusCode, cleanMsg)
}
