import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, X } from 'lucide-react';

export default function SourceDiscovery({ query, onImport, onCancel }) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [selectedUrls, setSelectedUrls] = useState(new Set());

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    import('../../services/sourcebookApi').then(({ searchSources }) => {
      searchSources(query)
        .then(data => {
          if (!isMounted) return;
          const searchResults = data.results || [];
          const topResults = searchResults.slice(0, 10);
          setResults(topResults);
          setSelectedUrls(new Set(topResults.map(r => r.url)));
          setLoading(false);
        })
        .catch(err => {
          console.error("Search failed:", err);
          if (isMounted) {
            setResults([]);
            setLoading(false);
          }
        });
    });

    return () => { isMounted = false; };
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
