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

// Rerank performs hybrid vector semantic + BM25 keyword reranking using Reciprocal Rank Fusion (RRF)
func (r *Reranker) Rerank(ctx context.Context, query string, docs []Document, limit int) ([]Document, error) {
	if len(docs) == 0 {
		return []Document{}, nil
	}

	bm25Scores := CalculateBM25(query, docs)

	var queryEmb []float32
	var err error
	if r.vectorClient != nil {
		queryEmb, err = r.vectorClient.GenerateQueryEmbedding(ctx, query)
	}
	if err != nil || len(queryEmb) == 0 {
		log.Printf("[Rerank] Vector query embedding unavailable: %v. Falling back to BM25-only.", err)
		return r.rerankBM25Only(docs, bm25Scores, limit), nil
	}

	vecScores := make([]float32, len(docs))
	var wg sync.WaitGroup
	for i, doc := range docs {
		wg.Add(1)
		go func(idx int, d Document) {
			defer wg.Done()
			if len(d.Embedding) > 0 {
				vecScores[idx] = vector.CosineSimilarity(queryEmb, d.Embedding)
				return
			}
			if r.vectorClient != nil {
				docEmb, err := r.vectorClient.GenerateQueryEmbedding(ctx, d.Content)
				if err == nil && len(docEmb) > 0 {
					vecScores[idx] = vector.CosineSimilarity(queryEmb, docEmb)
				}
			}
		}(i, doc)
	}
	wg.Wait()

	type rankPair struct {
		idx   int
		score float32
	}

	bm25Order := make([]rankPair, len(docs))
	vecOrder := make([]rankPair, len(docs))
	for i := range docs {
		bm25Order[i] = rankPair{idx: i, score: bm25Scores[i]}
		vecOrder[i] = rankPair{idx: i, score: vecScores[i]}
	}

	sort.Slice(bm25Order, func(i, j int) bool { return bm25Order[i].score > bm25Order[j].score })
	sort.Slice(vecOrder, func(i, j int) bool { return vecOrder[i].score > vecOrder[j].score })

	bm25Ranks := make([]int, len(docs))
	vecRanks := make([]int, len(docs))
	for rk, p := range bm25Order {
		bm25Ranks[p.idx] = rk + 1
	}
	for rk, p := range vecOrder {
		vecRanks[p.idx] = rk + 1
	}

	scoredList := make([]scoredDocument, len(docs))
	for i, doc := range docs {
		rrf := (0.65 / (60.0 + float32(vecRanks[i]))) + (0.35 / (60.0 + float32(bm25Ranks[i])))
		scoredList[i] = scoredDocument{doc: doc, score: rrf}
	}

	sort.Slice(scoredList, func(i, j int) bool {
		return scoredList[i].score > scoredList[j].score
	})

	retLimit := limit
	if len(scoredList) < retLimit {
		retLimit = len(scoredList)
	}

	results := make([]Document, retLimit)
	for i := 0; i < retLimit; i++ {
		results[i] = scoredList[i].doc
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
