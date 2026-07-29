package pipeline

import (
	"sort"
	"strings"

	"sourcebook/internal/models"
)

func (s *Store) SearchChunks(query string, limit int) []models.ChunkRecord {
	queryTerms := tokenize(query)
	if len(queryTerms) == 0 {
		return nil
	}

	s.mu.RLock()
	defer s.mu.RUnlock()

	type scored struct {
		chunk models.ChunkRecord
		score int
	}

	scoredChunks := make([]scored, 0, len(s.chunks))
	for _, chunk := range s.chunks {
		score := scoreChunk(chunk.Text, queryTerms)
		if score == 0 {
			continue
		}
		scoredChunks = append(scoredChunks, scored{
			chunk: *cloneChunk(chunk),
			score: score,
		})
	}

	sort.Slice(scoredChunks, func(i, j int) bool {
		if scoredChunks[i].score == scoredChunks[j].score {
			return scoredChunks[i].chunk.CreatedAt.After(scoredChunks[j].chunk.CreatedAt)
		}
		return scoredChunks[i].score > scoredChunks[j].score
	})

	if limit > 0 && len(scoredChunks) > limit {
		scoredChunks = scoredChunks[:limit]
	}

	out := make([]models.ChunkRecord, 0, len(scoredChunks))
	for _, item := range scoredChunks {
		out = append(out, item.chunk)
	}
	return out
}

func tokenize(text string) []string {
	text = strings.ToLower(text)
	fields := strings.FieldsFunc(text, func(r rune) bool {
		return r < 'a' || r > 'z' && (r < '0' || r > '9')
	})

	seen := make(map[string]struct{}, len(fields))
	tokens := make([]string, 0, len(fields))
	for _, field := range fields {
		field = strings.TrimSpace(field)
		if len(field) < 2 {
			continue
		}
		if _, ok := seen[field]; ok {
			continue
		}
		seen[field] = struct{}{}
		tokens = append(tokens, field)
	}
	return tokens
}

func scoreChunk(text string, terms []string) int {
	text = strings.ToLower(text)
	score := 0
	for _, term := range terms {
		if strings.Contains(text, term) {
			score++
		}
	}
	return score
}
