package api

import (
	"strings"
	"testing"
	"unicode/utf8"

	"sourcebook/internal/models"
)

func TestGenerateSynthesizedChapters_MultiByteAndEmoji(t *testing.T) {
	tests := []struct {
		name          string
		segmentText   string
		expectTrunc   bool
		minRuneCount  int
		maxRuneCount  int
	}{
		{
			name:        "Chinese string exceeding 42 runes (150+ bytes)",
			segmentText: "这是一个非常长的测试章节标题，用来验证多字节中文字符串在章节切片截断时是否会产生乱码或截断错误，确保字符完整性。",
			expectTrunc: true,
		},
		{
			name:        "Emoji string exceeding 42 runes and 42 bytes",
			segmentText: "🚀🔥🎉✨🌟💡🤖🧠💻⚡️🌈🪐🎯🎨🕹️🎪🎭🎬🎤🎧🎸🎹🎺🎻🥁🎯🎲🎱🎳🎮👾🌟🚀🔥🎉✨🌟💡🤖🧠💻⚡️🌈🪐🎯🎨🕹️🎪",
			expectTrunc: true,
		},
		{
			name:        "CJK string under 42 runes but over 42 bytes (25 chars = 75 bytes)",
			segmentText: "自然言語処理と機械学習の最新動向について解説します",
			expectTrunc: false,
		},
		{
			name:        "Mixed English and emoji cutting across 42 bytes",
			segmentText: "Building fast Go microservices with Kafka 🚀🔥 and distributed tracing telemetry",
			expectTrunc: true,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			segments := []models.YouTubeSegment{
				{Start: 0, Duration: 60, Text: "Initial video introduction"},
				{Start: 200, Duration: 60, Text: tc.segmentText},
			}

			chapters := generateSynthesizedChapters(segments, 600)
			if len(chapters) != 2 {
				t.Fatalf("expected 2 chapters, got %d", len(chapters))
			}

			ch := chapters[1]

			// Verify output is valid UTF-8
			if !utf8.ValidString(ch.Title) {
				t.Fatalf("chapter title is invalid UTF-8: %q", ch.Title)
			}

			r := []rune(ch.Title)
			if tc.expectTrunc {
				if !strings.HasSuffix(ch.Title, "...") {
					t.Errorf("expected title to end with '...', got: %q", ch.Title)
				}
				// 42 runes + 3 runes for "..."
				if len(r) != 45 {
					t.Errorf("expected 45 runes (42 + '...'), got %d", len(r))
				}
			} else {
				if strings.HasSuffix(ch.Title, "...") {
					t.Errorf("did not expect title under 42 runes to be truncated: %q", ch.Title)
				}
				if ch.Title != tc.segmentText {
					t.Errorf("expected %q, got %q", tc.segmentText, ch.Title)
				}
			}
		})
	}
}
