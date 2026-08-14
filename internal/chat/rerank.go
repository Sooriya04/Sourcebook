package chat

import (
	"context"
	"log"
	"sort"
	"strings"
	"sync"
	"sourcebook/internal/vector"
)

type Reranker struct {
	vectorClient *vector.Client
}

func NewReranker(vc *vector.Client) *Reranker {
	return &Reranker{
		vectorClient: vc,
	}
}

type scoredDocument struct {
	doc   Document
	score float32
}

// Rerank performs hybrid vector semantic + keyword overlap reranking
func (r *Reranker) Rerank(ctx context.Context, query string, docs []Document, limit int) ([]Document, error) {
	if len(docs) == 0 {
		return []Document{}, nil
	}

	// 1. Get query embedding
	queryEmb, err := r.vectorClient.GenerateQueryEmbedding(ctx, query)
	if err != nil {
		log.Printf("[Rerank] Semantic embedding failed: %v. Falling back to keyword-only reranking.", err)
		return r.rerankKeywordOnly(query, docs, limit), nil
	}

	// 2. Pre-process query terms for keyword scoring
	queryTerms := strings.Fields(strings.ToLower(query))

	// 3. Compute hybrid scores in parallel
	var mu sync.Mutex
	var scoredList []scoredDocument
	var wg sync.WaitGroup

	for _, doc := range docs {
		wg.Add(1)
		go func(d Document) {
			defer wg.Done()

			// Calculate vector embedding score
			docEmb, err := r.vectorClient.GenerateQueryEmbedding(ctx, d.Content)
			var vecScore float32 = 0.0
			if err == nil {
				vecScore = vector.CosineSimilarity(queryEmb, docEmb)
			}

			// Calculate keyword overlap score
			contentLower := strings.ToLower(d.Content)
			matchCount := 0
			for _, term := range queryTerms {
				if strings.Contains(contentLower, term) {
					matchCount++
				}
			}
			var kwScore float32 = 0.0
			if len(queryTerms) > 0 {
				kwScore = float32(matchCount) / float32(len(queryTerms))
			}

			// Hybrid score formula: 80% semantic + 20% keyword overlap
			hybridScore := (0.8 * vecScore) + (0.2 * kwScore)

			mu.Lock()
			scoredList = append(scoredList, scoredDocument{doc: d, score: hybridScore})
			mu.Unlock()
		}(doc)
	}

	wg.Wait()

	// 4. Sort by score descending
	sort.Slice(scoredList, func(i, j int) bool {
		return scoredList[i].score > scoredList[j].score
	})

	// 5. Select top limit
	retLimit := limit
	if len(scoredList) < retLimit {
		retLimit = len(scoredList)
	}

	var results []Document
	for i := 0; i < retLimit; i++ {
		results = append(results, scoredList[i].doc)
	}

	return results, nil
}

func (r *Reranker) rerankKeywordOnly(query string, docs []Document, limit int) []Document {
	queryTerms := strings.Fields(strings.ToLower(query))
	var scoredList []scoredDocument

	for _, d := range docs {
		contentLower := strings.ToLower(d.Content)
		matchCount := 0
		for _, term := range queryTerms {
			if strings.Contains(contentLower, term) {
				matchCount++
			}
		}
		var kwScore float32 = 0.0
		if len(queryTerms) > 0 {
			kwScore = float32(matchCount) / float32(len(queryTerms))
		}

		scoredList = append(scoredList, scoredDocument{doc: d, score: kwScore})
	}

	sort.Slice(scoredList, func(i, j int) bool {
		return scoredList[i].score > scoredList[j].score
	})

	retLimit := limit
	if len(scoredList) < retLimit {
		retLimit = len(scoredList)
	}

	var results []Document
	for i := 0; i < retLimit; i++ {
		results = append(results, scoredList[i].doc)
	}
	return results
}
