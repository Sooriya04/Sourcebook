package chat

import (
	"context"
	"log"
	"sort"
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

// Rerank performs hybrid vector semantic + BM25 keyword reranking
func (r *Reranker) Rerank(ctx context.Context, query string, docs []Document, limit int) ([]Document, error) {
	if len(docs) == 0 {
		return []Document{}, nil
	}

	// 1. Calculate Okapi BM25 keyword scores for all candidate docs
	bm25Scores := CalculateBM25(query, docs)

	// 2. Get query embedding
	queryEmb, err := r.vectorClient.GenerateQueryEmbedding(ctx, query)
	if err != nil {
		log.Printf("[Rerank] Semantic embedding failed: %v. Falling back to BM25-only reranking.", err)
		return r.rerankBM25Only(docs, bm25Scores, limit), nil
	}

	// 3. Compute hybrid scores (65% vector similarity + 35% BM25 keyword score) in parallel
	var mu sync.Mutex
	var scoredList []scoredDocument
	var wg sync.WaitGroup

	for i, doc := range docs {
		wg.Add(1)
		go func(idx int, d Document) {
			defer wg.Done()

			docEmb, err := r.vectorClient.GenerateQueryEmbedding(ctx, d.Content)
			var vecScore float32 = 0.0
			if err == nil {
				vecScore = vector.CosineSimilarity(queryEmb, docEmb)
			}

			bm25Score := bm25Scores[idx]
			hybridScore := (0.65 * vecScore) + (0.35 * bm25Score)

			mu.Lock()
			scoredList = append(scoredList, scoredDocument{doc: d, score: hybridScore})
			mu.Unlock()
		}(i, doc)
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

func (r *Reranker) rerankBM25Only(docs []Document, bm25Scores []float32, limit int) []Document {
	var scoredList []scoredDocument

	for i, d := range docs {
		score := float32(0.0)
		if i < len(bm25Scores) {
			score = bm25Scores[i]
		}
		scoredList = append(scoredList, scoredDocument{doc: d, score: score})
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
