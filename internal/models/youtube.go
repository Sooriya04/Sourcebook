package models

type YouTubeChapter struct {
	Title     string  `json:"title"`
	Start     float64 `json:"start"`
	Timestamp string  `json:"timestamp"`
}

type YouTubeSegment struct {
	Start     float64 `json:"start"`
	Duration  float64 `json:"duration"`
	Timestamp string  `json:"timestamp"`
	Text      string  `json:"text"`
}

type YouTubeVideoDetails struct {
	VideoID         string           `json:"video_id"`
	Title           string           `json:"title"`
	Channel         string           `json:"channel"`
	Duration        string           `json:"duration"`
	DurationSeconds int              `json:"duration_seconds"`
	Chapters        []YouTubeChapter `json:"chapters"`
	Segments        []YouTubeSegment `json:"segments"`
	Status          string           `json:"status"`
}
