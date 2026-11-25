package chat

import (
	"strings"
	"testing"
)

func TestBuildPromptMessagesPrecedence(t *testing.T) {
	hm := NewHistoryManager()
	docs := []Document{{Index: 1, Title: "Paper A", SourceType: "PDF", Content: "Sample findings."}}

	stdMsgs := hm.BuildPromptMessages("Analyze", docs, nil, nil, "standard", "Focus on limitations.")
	if len(stdMsgs) < 3 {
		t.Fatalf("expected at least 3 messages, got %d", len(stdMsgs))
	}
	if !strings.Contains(stdMsgs[0].Content, "## Output Format") {
		t.Error("standard mode should retain default Output Format guidance")
	}
	if !strings.Contains(stdMsgs[0].Content, "Focus on limitations.") {
		t.Error("standard mode should include custom instructions")
	}
	if !strings.Contains(stdMsgs[1].Content, "<retrieved_sources>") {
		t.Error("retrieved sources should be wrapped in <retrieved_sources> boundary")
	}

	priMsgs := hm.BuildPromptMessages("Analyze", docs, nil, nil, "custom_priority", "Output a 3-row table.")
	if strings.Contains(priMsgs[0].Content, "## Output Format") {
		t.Error("custom_priority mode should replace configurable Output Format defaults")
	}
	if !strings.Contains(priMsgs[0].Content, "Untrusted Context Boundary") {
		t.Error("custom_priority mode must preserve untrusted context boundary")
	}
	if !strings.Contains(priMsgs[0].Content, "Output a 3-row table.") {
		t.Error("custom_priority mode should include custom instructions")
	}
}

func TestBuildUngroundedMessages(t *testing.T) {
	hm := NewHistoryManager()
	msgs := hm.BuildUngroundedMessages("Explain transformers", nil, "custom_priority", "Use analogies.")
	if len(msgs) != 2 {
		t.Fatalf("expected system + user message, got %d", len(msgs))
	}
	if !strings.Contains(msgs[0].Content, "Source grounding is disabled") {
		t.Error("expected ungrounded notice in system prompt")
	}
	if !strings.Contains(msgs[0].Content, "Use analogies.") {
		t.Error("expected custom instructions in system prompt")
	}
}
