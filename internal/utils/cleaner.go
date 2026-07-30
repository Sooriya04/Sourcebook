package utils

import (
	"regexp"
	"strings"
)

var (
	multiNewlineRegex = regexp.MustCompile(`\n{3,}`)
	multiSpaceRegex   = regexp.MustCompile(`[ \t]{2,}`)
)

// CleanText normalizes scraped markdown/text by trimming extra whitespace and redundant newlines.
func CleanText(text string) string {
	if text == "" {
		return ""
	}

	// Standardize carriage returns
	text = strings.ReplaceAll(text, "\r\n", "\n")
	text = strings.ReplaceAll(text, "\r", "\n")

	// Replace tabs with single space
	text = strings.ReplaceAll(text, "\t", " ")

	// Trim trailing spaces per line
	lines := strings.Split(text, "\n")
	for i, line := range lines {
		lines[i] = strings.TrimRight(line, " ")
	}
	text = strings.Join(lines, "\n")

	// Collapse 3 or more consecutive newlines into 2
	text = multiNewlineRegex.ReplaceAllString(text, "\n\n")

	return strings.TrimSpace(text)
}
