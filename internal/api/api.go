package api

import (
	"sourcebook/internal/controller"
	"sourcebook/internal/pipeline"
	"sourcebook/internal/providers"
	"sourcebook/internal/synthesis"
)

type API struct {
	searchController     *controller.UnifiedSearchController
	pipelineSearchSource providers.SearchProvider
	pipelineStore        *pipeline.Store
	synthesizer          *synthesis.Synthesizer
}

func NewAPI(c *controller.UnifiedSearchController, pipelineSearchSource providers.SearchProvider, pipelineStore *pipeline.Store) *API {
	return &API{
		searchController:     c,
		pipelineSearchSource: pipelineSearchSource,
		pipelineStore:        pipelineStore,
		synthesizer:          synthesis.NewSynthesizer(),
	}
}
