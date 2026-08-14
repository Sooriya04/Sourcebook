package api

import (
	"context"
	"strings"
	"sourcebook/internal/agent"
	"sourcebook/internal/chat"
	"sourcebook/internal/controller"
	"sourcebook/internal/database"
	"sourcebook/internal/llm"
	"sourcebook/internal/pipeline"
	"sourcebook/internal/providers"
	"sourcebook/internal/synthesis"
	"sourcebook/internal/vector"
)

type API struct {
	searchController     *controller.UnifiedSearchController
	pipelineSearchSource providers.SearchProvider
	pipelineStore        *pipeline.Store
	synthesizer          *synthesis.Synthesizer
	repo                 *database.Repository
	vectorClient         *vector.Client
	sentinel             *agent.Sentinel
	chatController       *chat.Controller
}

func NewAPI(c *controller.UnifiedSearchController, pipelineSearchSource providers.SearchProvider, pipelineStore *pipeline.Store, repo *database.Repository) *API {
	api := &API{
		searchController:     c,
		pipelineSearchSource: pipelineSearchSource,
		pipelineStore:        pipelineStore,
		synthesizer:          synthesis.NewSynthesizer(),
		repo:                 repo,
		vectorClient:         vector.NewClient(),
	}
	api.sentinel = agent.NewSentinel(repo.DB())

	webRetrieve := func(ctx context.Context, query string, maxSources int) ([]chat.Document, error) {
		scraped, _, err := api.fetchPipelineSources(ctx, query, maxSources, nil, "")
		if err != nil {
			return nil, err
		}
		docs := make([]chat.Document, len(scraped))
		for i, s := range scraped {
			srcType := "Web"
			if strings.Contains(s.URL, "youtube.com") || strings.Contains(s.URL, "youtu.be") {
				srcType = "YouTube"
			} else if strings.Contains(s.URL, "arxiv.org") {
				srcType = "Arxiv"
			}
			docs[i] = chat.Document{
				Title:      s.Title,
				URL:        s.URL,
				Content:    s.Content,
				SourceType: srcType,
			}
		}
		return docs, nil
	}

	retriever := chat.NewRetriever(repo, webRetrieve)
	reranker := chat.NewReranker(api.vectorClient)
	history := chat.NewHistoryManager()
	llmClient := llm.NewClient()

	api.chatController = chat.NewController(retriever, reranker, history, llmClient)

	return api
}
