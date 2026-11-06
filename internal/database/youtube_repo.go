package database

import (
	"context"
	"database/sql"
	"time"
)

type YouTubeVideoRecord struct {
	VideoID         string    `json:"video_id"`
	Title           string    `json:"title"`
	Channel         string    `json:"channel"`
	DurationSeconds int       `json:"duration_seconds"`
	ChaptersJSON    string    `json:"chapters_json"`
	SegmentsJSON    string    `json:"segments_json"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

type YouTubeChatMessageRecord struct {
	ID        string    `json:"id"`
	VideoID   string    `json:"video_id"`
	Role      string    `json:"role"`
	Content   string    `json:"content"`
	CreatedAt time.Time `json:"created_at"`
}

func (r *Repository) GetYouTubeVideo(ctx context.Context, videoID string) (*YouTubeVideoRecord, error) {
	query := `SELECT video_id, title, channel, duration_seconds, chapters_json, segments_json, status, created_at, updated_at 
	          FROM youtube_videos WHERE video_id = ?`
	row := r.db.QueryRowContext(ctx, query, videoID)

	var v YouTubeVideoRecord
	err := row.Scan(&v.VideoID, &v.Title, &v.Channel, &v.DurationSeconds, &v.ChaptersJSON, &v.SegmentsJSON, &v.Status, &v.CreatedAt, &v.UpdatedAt)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, nil
		}
		return nil, err
	}
	return &v, nil
}

func (r *Repository) UpsertYouTubeVideo(ctx context.Context, v *YouTubeVideoRecord) error {
	query := `INSERT INTO youtube_videos (video_id, title, channel, duration_seconds, chapters_json, segments_json, status, updated_at)
	          VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
	          ON CONFLICT(video_id) DO UPDATE SET
	              title = excluded.title,
	              channel = excluded.channel,
	              duration_seconds = excluded.duration_seconds,
	              chapters_json = excluded.chapters_json,
	              segments_json = excluded.segments_json,
	              status = excluded.status,
	              updated_at = CURRENT_TIMESTAMP`
	_, err := r.db.ExecContext(ctx, query, v.VideoID, v.Title, v.Channel, v.DurationSeconds, v.ChaptersJSON, v.SegmentsJSON, v.Status)
	return err
}

func (r *Repository) GetYouTubeChatMessages(ctx context.Context, videoID string) ([]YouTubeChatMessageRecord, error) {
	query := `SELECT id, video_id, role, content, created_at 
	          FROM youtube_chat_messages WHERE video_id = ? ORDER BY created_at ASC`
	rows, err := r.db.QueryContext(ctx, query, videoID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var list []YouTubeChatMessageRecord
	for rows.Next() {
		var m YouTubeChatMessageRecord
		if err := rows.Scan(&m.ID, &m.VideoID, &m.Role, &m.Content, &m.CreatedAt); err != nil {
			return nil, err
		}
		list = append(list, m)
	}
	return list, nil
}

func (r *Repository) InsertYouTubeChatMessage(ctx context.Context, m *YouTubeChatMessageRecord) error {
	query := `INSERT INTO youtube_chat_messages (id, video_id, role, content) VALUES (?, ?, ?, ?)`
	_, err := r.db.ExecContext(ctx, query, m.ID, m.VideoID, m.Role, m.Content)
	return err
}
