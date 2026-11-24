package api

import (
	"context"
	"os"
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
	llmClient            *llm.Client
}

func NewAPI(c *controller.UnifiedSearchController, pipelineSearchSource providers.SearchProvider, pipelineStore *pipeline.Store, repo *database.Repository) *API {
	llmClient := llm.NewClient()
	if repo != nil {
		if s, err := repo.GetSettings(); err == nil && s != nil {
			envProvider := strings.TrimSpace(os.Getenv("LLM_PROVIDER"))
			envKey := strings.TrimSpace(os.Getenv("LLM_API_KEY"))

			// Check if DB settings has an unconfigured default OpenAI row (empty API key on default OpenAI endpoint)
			isOpenAIWithoutKey := strings.EqualFold(s.LLMProvider, "openai") && strings.TrimSpace(s.LLMAPIKey) == "" && (s.LLMBaseURL == "" || s.LLMBaseURL == "https://api.openai.com/v1")

			if s.LLMProvider == "" || isOpenAIWithoutKey {
				// Don't clobber the valid env provider with an unconfigured empty-key OpenAI.
				// If env has a configured provider or if default is ollama, sync DB to match env configuration.
				p, u, m, k := llmClient.GetConfig()
				if envProvider != "" || envKey != "" {
					_ = repo.UpdateLLMSettings(p, u, m, k)
				}
			} else {
				llmClient.SetConfig(s.LLMProvider, s.LLMBaseURL, s.LLMModel, s.LLMAPIKey)
			}
		}
	}
	api := &API{
		searchController:     c,
		pipelineSearchSource: pipelineSearchSource,
		pipelineStore:        pipelineStore,
		synthesizer:          synthesis.NewSynthesizer(llmClient),
		repo:                 repo,
		vectorClient:         vector.NewClient(),
		llmClient:            llmClient,
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
	memoryRetriever := chat.NewMemoryRetriever(repo, api.vectorClient)
	planner := chat.NewQueryPlanner(llmClient)
	agentLoop := chat.NewAgentLoop(api.vectorClient, retriever, llmClient, planner)

	api.chatController = chat.NewController(retriever, reranker, history, memoryRetriever, planner, agentLoop, llmClient, repo, api.vectorClient)

	return api
}

// NewTestAPI wires a lightweight API instance for integration and provider mutation tests.
func NewTestAPI(repo *database.Repository, llmClient *llm.Client, synthesizer *synthesis.Synthesizer) *API {
	return &API{
		repo:         repo,
		llmClient:    llmClient,
		synthesizer:  synthesizer,
		vectorClient: vector.NewClient(),
	}
}
