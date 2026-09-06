package chat

import (
	"math"
	"regexp"
	"strings"
)

var wordRegexp = regexp.MustCompile(`[a-zA-Z0-9]+`)

// Tokenize converts text to lowercase alphanumeric word tokens
func Tokenize(text string) []string {
	matches := wordRegexp.FindAllString(strings.ToLower(text), -1)
	if matches == nil {
		return []string{}
	}
	return matches
}

// CalculateBM25 computes normalized Okapi BM25 scores for a list of documents relative to query
func CalculateBM25(query string, docs []Document) []float32 {
	if len(docs) == 0 {
		return nil
	}

	queryTokens := Tokenize(query)
	if len(queryTokens) == 0 {
		scores := make([]float32, len(docs))
		return scores
	}

	k1 := 1.5
	b := 0.75
	N := float64(len(docs))

	// Pre-process document tokens and doc lengths
	docTokens := make([][]string, len(docs))
	docLengths := make([]float64, len(docs))
	var totalLen float64

	for i, d := range docs {
		tokens := Tokenize(d.Content)
		docTokens[i] = tokens
		length := float64(len(tokens))
		docLengths[i] = length
		totalLen += length
	}

	avgdl := totalLen / N
	if avgdl == 0 {
		avgdl = 1.0
	}

	// Calculate Document Frequency (df) for query terms
	df := make(map[string]int)
	for _, term := range queryTokens {
		if _, exists := df[term]; exists {
			continue
		}
		count := 0
		for _, tokens := range docTokens {
			for _, t := range tokens {
				if t == term {
					count++
					break
				}
			}
		}
		df[term] = count
	}

	// Calculate IDF for query terms
	idf := make(map[string]float64)
	for term, docFreq := range df {
		val := math.Log((N - float64(docFreq) + 0.5)/(float64(docFreq) + 0.5) + 1.0)
		if val < 0 {
			val = 0
		}
		idf[term] = val
	}

	// Compute BM25 raw score for each document
	rawScores := make([]float64, len(docs))
	var maxScore float64

	for i, tokens := range docTokens {
		// Calculate term frequencies in current doc
		tf := make(map[string]float64)
		for _, t := range tokens {
			tf[t]++
		}

		var docScore float64
		for _, qTerm := range queryTokens {
			freq := tf[qTerm]
			if freq == 0 {
				continue
			}
			num := freq * (k1 + 1.0)
			denom := freq + k1*(1.0-b+b*(docLengths[i]/avgdl))
			docScore += idf[qTerm] * (num / denom)
		}

		rawScores[i] = docScore
		if docScore > maxScore {
			maxScore = docScore
		}
	}

	// Normalize scores to [0.0, 1.0]
	scores := make([]float32, len(docs))
	for i, s := range rawScores {
		if maxScore > 0 {
			scores[i] = float32(s / maxScore)
		} else {
			scores[i] = 0.0
		}
	}

	return scores
}
