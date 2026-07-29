package registry

import (
	"fmt"
	"sync"
	
	"sourcebook/internal/providers"
)

type ProviderRegistry struct {
	mu        sync.RWMutex
	providers map[string]providers.SearchProvider
}

func NewProviderRegistry() *ProviderRegistry {
	return &ProviderRegistry{
		providers: make(map[string]providers.SearchProvider),
	}
}

func (r *ProviderRegistry) Register(p providers.SearchProvider) {
	r.mu.Lock()
	defer r.mu.Unlock()
	r.providers[p.Name()] = p
}

func (r *ProviderRegistry) Get(name string) (providers.SearchProvider, error) {
	r.mu.RLock()
	defer r.mu.RUnlock()
	p, ok := r.providers[name]
	if !ok {
		return nil, fmt.Errorf("provider %s not found", name)
	}
	return p, nil
}

func (r *ProviderRegistry) GetAll() []providers.SearchProvider {
	r.mu.RLock()
	defer r.mu.RUnlock()
	list := make([]providers.SearchProvider, 0, len(r.providers))
	for _, p := range r.providers {
		list = append(list, p)
	}
	return list
}
