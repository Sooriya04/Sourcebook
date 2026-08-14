package chat

import (
	"context"
	"fmt"
	"log"
	"math"
	"sourcebook/internal/vector"
	"strings"
)

type EvaluationResult struct {
	RelevantDocs      []Document `json:"relevant_docs"`
	AverageScore      float32    `json:"average_score"`
	Sufficient        bool       `json:"sufficient"`
	SuggestedSubQuery string     `json:"suggested_sub_query,omitempty"`
}

type SelfEvaluator struct {
	vectorClient *vector.Client
}

func NewSelfEvaluator(vc *vector.Client) *SelfEvaluator {
	return &SelfEvaluator{
		vectorClient: vc,
	}
}

// EvaluateContext rates each retrieved doc chunk for relevance to the user's query.
func (e *SelfEvaluator) EvaluateContext(ctx context.Context, query string, docs []Document) (*EvaluationResult, error) {
	if len(docs) == 0 {
		return &EvaluationResult{
			RelevantDocs:      []Document{},
			AverageScore:      0.0,
			Sufficient:        false,
			SuggestedSubQuery: query,
		}, nil
	}

	queryLower := strings.ToLower(query)
	queryTerms := strings.Fields(queryLower)

	var queryEmb []float32
	var err error
	if e.vectorClient != nil {
		queryEmb, err = e.vectorClient.GenerateQueryEmbedding(ctx, query)
		if err != nil {
			log.Printf("[SelfEvaluator] Query embedding failed: %v. Using keyword fallback.", err)
		}
	}

	var totalScore float32 = 0.0
	var relevant []Document

	for _, doc := range docs {
		contentLower := strings.ToLower(doc.Content)
		titleLower := strings.ToLower(doc.Title)

		// 1. Keyword overlap score
		matchCount := 0
		for _, term := range queryTerms {
			if len(term) > 2 && (strings.Contains(contentLower, term) || strings.Contains(titleLower, term)) {
				matchCount++
			}
		}
		var kwScore float32 = 0.0
		if len(queryTerms) > 0 {
			kwScore = float32(matchCount) / float32(len(queryTerms))
		}

		// 2. Semantic vector score
		var vecScore float32 = 0.0
		if len(queryEmb) > 0 && e.vectorClient != nil {
			docEmb, err := e.vectorClient.GenerateQueryEmbedding(ctx, doc.Content)
			if err == nil {
				vecScore = vector.CosineSimilarity(queryEmb, docEmb)
			}
		}

		// 3. Combined relevance score (70% Semantic + 30% Keyword)
		score := (0.7 * vecScore) + (0.3 * kwScore)

		// Soft threshold: Filter out docs scoring below 0.25
		if score >= 0.25 {
			relevant = append(relevant, doc)
			totalScore += score
		}
	}

	var avgScore float32 = 0.0
	if len(relevant) > 0 {
		avgScore = totalScore / float32(len(relevant))
	}

	// Sufficiency condition: at least 1 relevant doc with average score >= 0.32
	sufficient := len(relevant) >= 1 && (avgScore >= 0.32 || len(docs) >= 3)

	suggestedQuery := ""
	if !sufficient {
		suggestedQuery = fmt.Sprintf("%s background paper framework", query)
	}

	log.Printf("[SelfEvaluator] Evaluated %d docs -> %d relevant (avg score: %.2f, sufficient: %v)",
		len(docs), len(relevant), avgScore, sufficient)

	return &EvaluationResult{
		RelevantDocs:      relevant,
		AverageScore:      float32(math.Round(float64(avgScore)*100) / 100),
		Sufficient:        sufficient,
		SuggestedSubQuery: suggestedQuery,
	}, nil
}
