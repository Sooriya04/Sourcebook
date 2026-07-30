package llm

// Message represents a single message in an LLM conversation.
type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

// SourceCitation represents a cited source in the synthesis.
type SourceCitation struct {
	Index int    `json:"index"`
	Title string `json:"title"`
	URL   string `json:"url"`
}

// SynthesisResponse is the final structured output from the LLM synthesis pipeline.
type SynthesisResponse struct {
	Query      string           `json:"query"`
	Answer     string           `json:"answer"`
	Sources    []SourceCitation `json:"sources"`
	DurationMs int64            `json:"duration_ms"`
}
