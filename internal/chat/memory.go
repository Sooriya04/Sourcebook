package chat

import (
	"context"
	"log"
	"sort"
	"sourcebook/internal/database"
	"sourcebook/internal/llm"
	"sourcebook/internal/vector"
	"strings"
	"time"
)

type MemoryRetriever struct {
	repo         *database.Repository
	vectorClient *vector.Client
}

func NewMemoryRetriever(repo *database.Repository, vc *vector.Client) *MemoryRetriever {
	return &MemoryRetriever{
		repo:         repo,
		vectorClient: vc,
	}
}

type scoredMemoryPair struct {
	userMsg      llm.Message
	assistantMsg llm.Message
	score        float32
	createdAt    time.Time
}

// RetrieveRelevantHistory embeds query and cosine-ranks all past Q&A turns.
// Returns the topN most semantically relevant (User + Assistant) pairs.
func (m *MemoryRetriever) RetrieveRelevantHistory(ctx context.Context, notebookID, query string, topN int) ([]llm.Message, error) {
	if notebookID == "" || strings.TrimSpace(query) == "" {
		return nil, nil
	}

	records, err := m.repo.GetMemoryByNotebook(notebookID)
	if err != nil || len(records) == 0 {
		return nil, nil
	}

	// 1. Generate Query Embedding
	queryEmb, err := m.vectorClient.GenerateQueryEmbedding(ctx, query)
	if err != nil {
		log.Printf("[MemoryRetriever] Failed to embed query for memory retrieval: %v", err)
		return nil, nil
	}

	// 2. Group records into Q&A pairs (user message + following assistant response)
	type pair struct {
		userIndex int
		userRec   string
		userEmb   []float32
		userText  string
		userTime  time.Time
		asstText  string
	}

	var pairs []pair
	for i := 0; i < len(records); i++ {
		rec := records[i]
		if rec.Role == "user" {
			asstContent := ""
			if i+1 < len(records) && records[i+1].Role == "assistant" {
				asstContent = records[i+1].Content
			}
			pairs = append(pairs, pair{
				userIndex: i,
				userRec:   rec.ID,
				userEmb:   rec.Embedding,
				userText:  rec.Content,
				userTime:  rec.CreatedAt,
				asstText:  asstContent,
			})
		}
	}

	if len(pairs) == 0 {
		return nil, nil
	}

	// 3. Compute cosine similarity score for each pair against queryEmb
	var scoredPairs []scoredMemoryPair
	for _, p := range pairs {
		var sim float32 = 0.0
		if len(p.userEmb) > 0 {
			sim = vector.CosineSimilarity(queryEmb, p.userEmb)
		}

		scoredPairs = append(scoredPairs, scoredMemoryPair{
			userMsg:      llm.Message{Role: "user", Content: p.userText},
			assistantMsg: llm.Message{Role: "assistant", Content: p.asstText},
			score:        sim,
			createdAt:    p.userTime,
		})
	}

	// 4. Sort descending by similarity score
	sort.Slice(scoredPairs, func(i, j int) bool {
		return scoredPairs[i].score > scoredPairs[j].score
	})

	// 5. Select top N pairs
	limit := topN
	if limit <= 0 {
		limit = 3
	}
	if len(scoredPairs) < limit {
		limit = len(scoredPairs)
	}

	selected := scoredPairs[:limit]

	// 6. Re-sort selected pairs chronologically so conversation context flows naturally
	sort.Slice(selected, func(i, j int) bool {
		return selected[i].createdAt.Before(selected[j].createdAt)
	})

	// 7. Flatten into []llm.Message
	var result []llm.Message
	for _, item := range selected {
		result = append(result, item.userMsg)
		if item.assistantMsg.Content != "" {
			result = append(result, item.assistantMsg)
		}
	}

	return result, nil
}

// SaveTurn Async/Sync saves a chat turn into the database and generates its vector embedding.
func (m *MemoryRetriever) SaveTurn(notebookID, messageID, role, content string) {
	if notebookID == "" || strings.TrimSpace(content) == "" {
		return
	}

	// Run in background goroutine to prevent blocking HTTP response
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		emb, err := m.vectorClient.GenerateQueryEmbedding(ctx, content)
		if err != nil {
			log.Printf("[MemoryRetriever] Failed to embed chat turn (%s): %v", role, err)
			emb = nil
		}

		if err := m.repo.SaveMemory(notebookID, messageID, role, content, emb); err != nil {
			log.Printf("[MemoryRetriever] Failed to save chat memory: %v", err)
		}
	}()
}
