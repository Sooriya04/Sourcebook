package api

import (
	"sourcebook/internal/controller"
	"sourcebook/internal/database"
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
}

func NewAPI(c *controller.UnifiedSearchController, pipelineSearchSource providers.SearchProvider, pipelineStore *pipeline.Store, repo *database.Repository) *API {
	return &API{
		searchController:     c,
		pipelineSearchSource: pipelineSearchSource,
		pipelineStore:        pipelineStore,
		synthesizer:          synthesis.NewSynthesizer(),
		repo:                 repo,
		vectorClient:         vector.NewClient(),
	}
}
