package pipeline

import (
	"encoding/json"
	"strings"

	"sourcebook/internal/models"
)

func (s *Store) IndexRawResult(jobID string, payload []byte) error {
	if len(payload) == 0 {
		return nil
	}

	var decoded any
	if err := json.Unmarshal(payload, &decoded); err != nil {
		return nil
	}

	seen := make(map[string]struct{})
	s.walkValue(jobID, decoded, seen)
	return nil
}

func (s *Store) walkValue(jobID string, value any, seen map[string]struct{}) {
	switch typed := value.(type) {
	case map[string]any:
		s.walkObject(jobID, typed, seen)
	case []any:
		for _, item := range typed {
			s.walkValue(jobID, item, seen)
		}
	}
}

func (s *Store) walkObject(jobID string, object map[string]any, seen map[string]struct{}) {
	if urlValue := stringValue(object, "url", "link", "source_url"); urlValue != "" {
		canonical := NormalizeURL(urlValue)
		if canonical == "" {
			canonical = urlValue
		}

		content := firstNonEmpty(
			stringValue(object, "content", "text", "body", "markdown", "snippet"),
			stringValue(object, "summary", "description"),
		)

		title := stringValue(object, "title", "name")
		key := hashString(canonical, title, content)
		if _, ok := seen[key]; !ok && (content != "" || title != "") {
			seen[key] = struct{}{}
			sourceID := s.sourceIDForCanonicalURL(canonical)
			doc := models.DocumentRecord{
				SourceID:     sourceID,
				Title:        title,
				URL:          urlValue,
				CanonicalURL: canonical,
				Content:      content,
				Metadata:     cloneObject(object),
			}
			stored := s.SaveDocument(jobID, doc)
			if content != "" {
				s.saveChunksFromText(jobID, stored.ID, sourceID, content, cloneObject(object))
			}
		}
	}

	for _, key := range []string{"results", "items", "sources", "documents", "chunks", "data"} {
		if nested, ok := object[key]; ok {
			s.walkValue(jobID, nested, seen)
		}
	}

	if chunks, ok := object["chunks"]; ok {
		switch typed := chunks.(type) {
		case []any:
			for index, chunkValue := range typed {
				switch chunk := chunkValue.(type) {
				case string:
					s.SaveChunk(jobID, models.ChunkRecord{
						DocumentID: stringValue(object, "document_id", "doc_id"),
						SourceID:   stringValue(object, "source_id"),
						Index:      index,
						Text:       strings.TrimSpace(chunk),
						Metadata:   cloneObject(object),
					})
				case map[string]any:
					text := firstNonEmpty(
						stringValue(chunk, "text", "content", "markdown", "body"),
						stringValue(chunk, "snippet"),
					)
					if text == "" {
						continue
					}
					s.SaveChunk(jobID, models.ChunkRecord{
						DocumentID: stringValue(chunk, "document_id", "doc_id"),
						SourceID:   stringValue(chunk, "source_id"),
						Index:      index,
						Text:       text,
						Metadata:   cloneObject(chunk),
					})
				}
			}
		}
	}
}

func (s *Store) saveChunksFromText(jobID, documentID, sourceID, text string, metadata map[string]interface{}) {
	for index, chunk := range splitText(text, 1200) {
		if strings.TrimSpace(chunk) == "" {
			continue
		}
		s.SaveChunk(jobID, models.ChunkRecord{
			DocumentID: documentID,
			SourceID:   sourceID,
			Index:      index,
			Text:       strings.TrimSpace(chunk),
			Metadata:   cloneMap(metadata),
		})
	}
}

func splitText(text string, maxChars int) []string {
	lines := strings.Split(text, "\n\n")
	chunks := make([]string, 0, len(lines))
	var current strings.Builder

	flush := func() {
		if current.Len() == 0 {
			return
		}
		chunks = append(chunks, strings.TrimSpace(current.String()))
		current.Reset()
	}

	for _, part := range lines {
		part = strings.TrimSpace(part)
		if part == "" {
			continue
		}
		if current.Len() > 0 && current.Len()+len(part)+2 > maxChars {
			flush()
		}
		if current.Len() > 0 {
			current.WriteString("\n\n")
		}
		current.WriteString(part)
	}
	flush()

	if len(chunks) == 0 && strings.TrimSpace(text) != "" {
		return []string{strings.TrimSpace(text)}
	}
	return chunks
}

func stringValue(object map[string]any, keys ...string) string {
	for _, key := range keys {
		if value, ok := object[key]; ok {
			if str, ok := value.(string); ok {
				return strings.TrimSpace(str)
			}
		}
	}
	return ""
}

func cloneObject(object map[string]any) map[string]interface{} {
	if object == nil {
		return nil
	}
	out := make(map[string]interface{}, len(object))
	for key, value := range object {
		out[key] = value
	}
	return out
}

func (s *Store) sourceIDForCanonicalURL(canonical string) string {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if id, ok := s.sourceIndex[canonical]; ok {
		return id
	}
	return ""
}
