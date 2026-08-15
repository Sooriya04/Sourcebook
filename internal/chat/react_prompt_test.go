package chat

import (
	"testing"
)

func TestParseReActJSON(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		wantTh   string
		wantAct  string
		wantInp  string
		wantErr  bool
	}{
		{
			name: "Clean JSON",
			input: `{
				"thought": "Let's search the web for VLM benchmarks",
				"action": "search_web",
				"action_input": "2025 VLM multi-step reasoning"
			}`,
			wantTh:  "Let's search the web for VLM benchmarks",
			wantAct: "search_web",
			wantInp: "2025 VLM multi-step reasoning",
			wantErr: false,
		},
		{
			name: "Markdown Code Block Wrapping",
			input: "```json\n{\n  \"thought\": \"Find details on Kokoro TTS\",\n  \"action\": \"search_notebook\",\n  \"action_input\": \"Kokoro TTS architecture\"\n}\n```",
			wantTh:  "Find details on Kokoro TTS",
			wantAct: "search_notebook",
			wantInp: "Kokoro TTS architecture",
			wantErr: false,
		},
		{
			name: "Markdown Code Block without Language Tag",
			input: "```\n{\n  \"thought\": \"Finished evaluation\",\n  \"action\": \"finish\",\n  \"action_input\": \"\"\n}\n```",
			wantTh:  "Finished evaluation",
			wantAct: "finish",
			wantInp: "",
			wantErr: false,
		},
		{
			name:    "Invalid JSON",
			input:   `{"thought": "broken JSON", "action": "finish"`,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			res, err := ParseReActJSON(tt.input)
			if (err != nil) != tt.wantErr {
				t.Fatalf("ParseReActJSON() error = %v, wantErr = %v", err, tt.wantErr)
			}
			if tt.wantErr {
				return
			}
			if res.Thought != tt.wantTh {
				t.Errorf("res.Thought = %q, want %q", res.Thought, tt.wantTh)
			}
			if res.Action != tt.wantAct {
				t.Errorf("res.Action = %q, want %q", res.Action, tt.wantAct)
			}
			if res.ActionInput != tt.wantInp {
				t.Errorf("res.ActionInput = %q, want %q", res.ActionInput, tt.wantInp)
			}
		})
	}
}
