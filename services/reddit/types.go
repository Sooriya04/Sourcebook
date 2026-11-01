package main

type ScrapeRequest struct {
	URL  string   `json:"url,omitempty"`
	URLs []string `json:"urls,omitempty"`
}

type ScrapeResult struct {
	URL      string `json:"url"`
	Title    string `json:"title"`
	Markdown string `json:"markdown"`
	Success  bool   `json:"success"`
	Error    string `json:"error,omitempty"`
}

type BatchResponse struct {
	Success bool           `json:"success"`
	Data    []ScrapeResult `json:"data"`
}
