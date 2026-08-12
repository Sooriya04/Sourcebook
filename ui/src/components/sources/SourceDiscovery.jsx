import React, { useState, useEffect } from 'react';
import { ChevronLeft, Check, FileSearch, PlayCircle } from 'lucide-react';
import { searchSources } from '../../services/sourcebookApi';

export default function SourceDiscovery({ query, onImport, onCancel }) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [selectedUrls, setSelectedUrls] = useState(new Set());

  useEffect(() => {
    if (!query) return;
    let isMounted = true;
    setLoading(true);

    searchSources(query)
      .then(data => {
        if (!isMounted) return;
        const searchResults = data.results || (data.data && data.data.results) || [];
        const topResults = searchResults.slice(0, 20);
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

    return () => { isMounted = false; };
  }, [query]);

  const toggleSelection = (url) => {
    const newSelection = new Set(selectedUrls);
    if (newSelection.has(url)) {
      newSelection.delete(url);
    } else {
      if (newSelection.size >= 20) {
        alert("Maximum 20 sources can be imported at once.");
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
      const allUrls = results.slice(0, 20).map(r => r.url);
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
      </div>

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
                {selectedUrls.size === results.length && results.length > 0 ? 'Clear all' : 'Select all'}
              </button>
            </div>
            
            <div className="discovery-list">
              {results.map((res, i) => {
                const isYouTube = res.url.includes('youtube.com') || res.url.includes('youtu.be') || res.source === 'YouTube';
                return (
                <div 
                  key={i} 
                  className={`discovery-item ${selectedUrls.has(res.url) ? 'selected' : ''}`}
                  onClick={() => toggleSelection(res.url)}
                >
                  <div className="discovery-item-icon">
                    {isYouTube ? <PlayCircle size={14} color="#ff0000" /> : <FileSearch size={14} />}
                  </div>
                  <div className="discovery-item-content">
                    <div className="discovery-item-title">{res.title}</div>
                    <div className="discovery-item-snippet">{res.snippet}</div>
                  </div>
                  <div className="discovery-checkbox">
                    {selectedUrls.has(res.url) && <Check size={13} strokeWidth={3} />}
                  </div>
                </div>
              )})}
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
