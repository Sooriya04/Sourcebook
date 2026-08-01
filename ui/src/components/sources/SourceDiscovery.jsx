import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, X } from 'lucide-react';

export default function SourceDiscovery({ query, onImport, onCancel }) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [selectedUrls, setSelectedUrls] = useState(new Set());

  // Mock search results simulating SearXNG backend response
  useEffect(() => {
    setLoading(true);
    // Simulate network delay
    const timer = setTimeout(() => {
      setResults([
        {
          title: "Towards Agentic RAG with Deep Reasoning: A Survey on ...",
          snippet: "You can explore high-level research synthesizing advanced...",
          url: "https://arxiv.org/abs/2401.mock1"
        },
        {
          title: "Reasoning RAG via System 1 or System 2: A Survey on ...",
          snippet: "You will find a categorization of agentic RAG methods into ...",
          url: "https://arxiv.org/abs/2402.mock2"
        },
        {
          title: "Agentic RAG vs Standard RAG: Why AI Agents Need M...",
          snippet: "You can compare architectural differences between static ...",
          url: "https://example.com/blog/agentic-rag-mock"
        },
        {
          title: "Self-RAG: Learning to Retrieve, Generate, and Critique ...",
          snippet: "You will learn about self-reflective tokens that allow models...",
          url: "https://arxiv.org/abs/2403.mock4"
        }
      ]);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [query]);

  const toggleSelection = (url) => {
    const newSelection = new Set(selectedUrls);
    if (newSelection.has(url)) {
      newSelection.delete(url);
    } else {
      if (newSelection.size >= 10) {
        alert("Maximum 10 sources can be imported at once.");
        return;
      }
      newSelection.add(url);
    }
    setSelectedUrls(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedUrls.size === results.length) {
      setSelectedUrls(new Set());
    } else {
      const allUrls = results.slice(0, 10).map(r => r.url);
      setSelectedUrls(new Set(allUrls));
    }
  };

  const handleImport = () => {
    const sourcesToImport = results
      .filter(r => selectedUrls.has(r.url))
      .map(r => ({ title: r.title, url: r.url, type: 'web' }));
    
    if (sourcesToImport.length > 0) {
      onImport(sourcesToImport);
    }
  };

  return (
    <div className="source-discovery-panel">
      <div className="discovery-header">
        <button className="back-to-sources-btn" onClick={onCancel}>
          <ChevronLeft size={16} /> Sources
        </button>
        <span className="discovery-header-title">Source discovery</span>
      </div>

      <div className="discovery-search-box">
        <Search size={16} color="var(--text-muted)" />
        <span className="discovery-query-text">{query}</span>
      </div>

      <p className="discovery-subtitle">
        These sources provide a technical roadmap for evolving standard retrieval into autonomous, reasoning-driven AI agent systems.
      </p>

      <div className="discovery-results-container">
        {loading ? (
          <div className="discovery-loading">
            <div className="spinner"></div>
            <span>Searching the web...</span>
          </div>
        ) : (
          <>
            <div className="discovery-results-header">
              <button className="select-all-btn" onClick={handleSelectAll}>
                Select all {selectedUrls.size === results.length && results.length > 0 ? '✓' : ''}
              </button>
            </div>
            
            <div className="discovery-list">
              {results.map((res, i) => (
                <div 
                  key={i} 
                  className={`discovery-item ${selectedUrls.has(res.url) ? 'selected' : ''}`}
                  onClick={() => toggleSelection(res.url)}
                >
                  <div className="discovery-item-icon">
                    {/* Placeholder icon based on url or generic */}
                    {res.url.includes('arxiv.org') ? 'X' : 'M'}
                  </div>
                  <div className="discovery-item-content">
                    <div className="discovery-item-title">{res.title}</div>
                    <div className="discovery-item-snippet">{res.snippet}</div>
                  </div>
                  <div className="discovery-checkbox">
                    {selectedUrls.has(res.url) && <span className="check-mark">✓</span>}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="discovery-footer">
        <div className="selected-count">
          {selectedUrls.size} sources selected
        </div>
        <button 
          className="import-btn" 
          disabled={selectedUrls.size === 0 || loading}
          onClick={handleImport}
        >
          Import
        </button>
      </div>
    </div>
  );
}
