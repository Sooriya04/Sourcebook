package api

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"sort"
	"sourcebook/internal/llm"
	"sourcebook/internal/models"
	"sourcebook/internal/synthesis"
	"sourcebook/internal/vector"
	"strings"
	"time"
)

type chunkScore struct {
	chunk models.DocumentChunk
	score float32
}

// HandleChat handles user questions, executes semantic notebook search or web search, and synthesizes a grounded response.
func (a *API) HandleChat(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Query      string `json:"query"`
		NotebookID string `json:"notebook_id,omitempty"`
		MaxSources int    `json:"max_sources,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if req.Query == "" {
		http.Error(w, "Query parameter 'query' is required", http.StatusBadRequest)
		return
	}

	maxSources := req.MaxSources
	if maxSources <= 0 || maxSources > 10 {
		maxSources = 5
	}

	startTime := time.Now()
	var docs []synthesis.ScrapedDoc
	var citations []llm.SourceCitation

	// If NotebookID is provided, run local semantic search using SQLite-stored embeddings
	if req.NotebookID != "" {
		log.Printf("[Chat] Running notebook semantic search for notebook: %s", req.NotebookID)

		sources, err := a.repo.GetSourcesByNotebook(req.NotebookID)
		if err != nil {
			log.Printf("[Chat] Failed to retrieve notebook sources: %v", err)
			http.Error(w, fmt.Sprintf("failed to retrieve sources: %v", err), http.StatusInternalServerError)
			return
		}

		sourceMap := make(map[string]models.SourceRecord)
		for _, src := range sources {
			sourceMap[src.ID] = src
		}

		// 1. Attempt to generate query embedding via embedding service
		queryEmb, err := a.vectorClient.GenerateQueryEmbedding(r.Context(), req.Query)
		if err != nil {
			log.Printf("[Chat] Warning: Ollama embedding service offline/failed (%v). Falling back to raw notebook source context.", err)
			limit := maxSources
			if len(sources) < limit {
				limit = len(sources)
			}
			for i := 0; i < limit; i++ {
				src := sources[i]
				docs = append(docs, synthesis.ScrapedDoc{
					Title:   src.Title,
					URL:     src.URL,
					Content: src.Content,
				})
				citations = append(citations, llm.SourceCitation{
					Index: i + 1,
					Title: src.Title,
					URL:   src.URL,
				})
			}
		} else {
			// 2. Fetch all document chunks for this notebook
			chunks, err := a.repo.GetChunksByNotebook(req.NotebookID)
			if err == nil && len(chunks) > 0 {
				var scores []chunkScore
				for _, chunk := range chunks {
					if len(chunk.Embedding) == 0 {
						continue
					}
					score := vector.CosineSimilarity(queryEmb, chunk.Embedding)
					scores = append(scores, chunkScore{chunk: chunk, score: score})
				}

				sort.Slice(scores, func(i, j int) bool {
					return scores[i].score > scores[j].score
				})

				limit := maxSources
				if len(scores) < limit {
					limit = len(scores)
				}

				log.Printf("[Chat] Found %d matching chunks. Selecting top %d.", len(scores), limit)

				for i := 0; i < limit; i++ {
					c := scores[i].chunk
					title := "Untitled Source"
					url := ""
					if src, ok := sourceMap[c.SourceID]; ok {
						title = src.Title
						url = src.URL
					}

					docs = append(docs, synthesis.ScrapedDoc{
						Title:   title,
						URL:     url,
						Content: c.Content,
					})

					citations = append(citations, llm.SourceCitation{
						Index: i + 1,
						Title: title,
						URL:   url,
					})
				}
			}

			// Fallback if no matching chunks were found
			if len(docs) == 0 {
				limit := maxSources
				if len(sources) < limit {
					limit = len(sources)
				}
				for i := 0; i < limit; i++ {
					src := sources[i]
					docs = append(docs, synthesis.ScrapedDoc{
						Title:   src.Title,
						URL:     src.URL,
						Content: src.Content,
					})
					citations = append(citations, llm.SourceCitation{
						Index: i + 1,
						Title: src.Title,
						URL:   src.URL,
					})
				}
			}
		}
	} else {
		// Fallback to global web search if no NotebookID is supplied
		log.Printf("[Chat] No notebook ID provided. Falling back to global search pipeline for query: %q", req.Query)
		webDocs, _, err := a.fetchPipelineSources(r.Context(), req.Query, maxSources, nil, "")
		if err != nil {
			log.Printf("[Chat] Pipeline fetch error: %v", err)
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		docs = webDocs

		for i, doc := range docs {
			citations = append(citations, llm.SourceCitation{
				Index: i + 1,
				Title: doc.Title,
				URL:   doc.URL,
			})
		}
	}

	// If no context could be retrieved, return empty answer immediately
	if len(docs) == 0 {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(&llm.SynthesisResponse{
			Query:      req.Query,
			Answer:     "No content could be retrieved from local notebook sources or web search.",
			Sources:    []llm.SourceCitation{},
			DurationMs: time.Since(startTime).Milliseconds(),
		})
		return
	}

	// Call the LLM synthesizer to generate the final grounded response
	synthesisResp, err := a.synthesizer.Synthesize(r.Context(), req.Query, docs)
	if err != nil {
		// Fallback logic: If local LLM server is not detected/refuses connection, return the raw retrieved text
		log.Printf("[Chat] Synthesis LLM call failed: %v. Returning raw chunks as fallback.", err)

		var builder strings.Builder
		builder.WriteString("Local LLM model is currently unavailable/refused connection. Here are the top relevant segments retrieved from your notebook sources:\n\n")
		for i, doc := range docs {
			builder.WriteString(fmt.Sprintf("[%d] From \"%s\":\n%s\n\n", i+1, doc.Title, strings.TrimSpace(doc.Content)))
		}

		synthesisResp = &llm.SynthesisResponse{
			Query:      req.Query,
			Answer:     builder.String(),
			Sources:    citations,
			DurationMs: time.Since(startTime).Milliseconds(),
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(synthesisResp)
}
