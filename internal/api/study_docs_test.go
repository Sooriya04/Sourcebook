package api

import (
	"encoding/json"
	"testing"
)

func TestExtractJSON_WithCitationPreambles(t *testing.T) {
	tests := []struct {
		name      string
		raw       string
		openChar  string
		closeChar string
		expected  string
	}{
		{
			name: "preamble citation before markdown block",
			raw: `Based on [1], here is the flashcards array:
` + "```json" + `
[
  {"front": "Question", "back": "Answer"}
]
` + "```" + `
Hope that helps!`,
			openChar:  "[",
			closeChar: "]",
			expected: `[
  {"front": "Question", "back": "Answer"}
]`,
		},
		{
			name:      "preamble and postamble citations without markdown fences",
			raw:       `Based on [1] and [2], here is the quiz: [{"question": "Q1", "answer": "A1"}] References: [3]`,
			openChar:  "[",
			closeChar: "]",
			expected:  `[{"question": "Q1", "answer": "A1"}]`,
		},
		{
			name:      "object with citation preamble without code fences",
			raw:       `According to source [1], the briefing document is: {"overview": "Overview text"}`,
			openChar:  "{",
			closeChar: "}",
			expected:  `{"overview": "Overview text"}`,
		},
		{
			name: "nested arrays and objects inside json",
			raw: `Based on [1]:
[
  {"question": "Pick one", "options": ["Option A", "Option B"], "answer": "Option A"}
]`,
			openChar:  "[",
			closeChar: "]",
			expected: `[
  {"question": "Pick one", "options": ["Option A", "Option B"], "answer": "Option A"}
]`,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			got := extractJSON(tc.raw, tc.openChar, tc.closeChar)
			if got != tc.expected {
				t.Fatalf("extractJSON() failed:\nexpected: %s\ngot:      %s", tc.expected, got)
			}
			var parsed interface{}
			if err := json.Unmarshal([]byte(got), &parsed); err != nil {
				t.Fatalf("extracted JSON could not be unmarshaled: %v", err)
			}
		})
	}
}
