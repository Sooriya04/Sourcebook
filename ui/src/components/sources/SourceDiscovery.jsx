import React, { useState, useEffect } from 'react';
import { ChevronLeft, Check, Globe, PlayCircle } from 'lucide-react';
import { searchSources } from '../../services/sourcebookApi';

export default function SourceDiscovery({ query, onImport, onCancel }) {
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [selectedUrls, setSelectedUrls] = useState(new Set());
  const [filterType, setFilterType] = useState('all');

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

  const isYouTube = (url, src) => url?.includes('youtube.com') || url?.includes('youtu.be') || src === 'YouTube';

  const filteredResults = results.filter(res => {
    const isYT = isYouTube(res.url, res.source);
    if (filterType === 'web') return !isYT;
    if (filterType === 'youtube') return isYT;
    return true;
  });

  const toggleSelection = (url) => {
    const next = new Set(selectedUrls);
    if (next.has(url)) next.delete(url);
    else next.add(url);
    setSelectedUrls(next);
  };

  const handleSelectAll = () => {
    if (selectedUrls.size === results.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(results.map(r => r.url)));
    }
  };

  const handleImport = () => {
    const sourcesToImport = results
      .filter(r => selectedUrls.has(r.url))
      .map(r => ({
        title: r.title,
        url: r.url,
        type: isYouTube(r.url, r.source) ? 'youtube' : 'web'
      }));
    if (sourcesToImport.length > 0) onImport(sourcesToImport);
  };

  const ytCount = results.filter(r => isYouTube(r.url, r.source)).length;
  const webCount = results.length - ytCount;

  return (
    <div className="source-discovery-panel">
      <div className="discovery-header">
        <button className="back-to-sources-btn" onClick={onCancel}>
          <ChevronLeft size={16} /> Back
        </button>
        <span className="discovery-header-title">Web Discovery</span>
      </div>

      <div className="discovery-results-container">
        {loading ? (
          <div className="discovery-loading">
            <div className="spinner"></div>
            <span>Searching the web...</span>
          </div>
        ) : (
          <>
            <div className="discovery-toolbar">
              <div className="discovery-toolbar-row">
                <label className="discovery-select-all-label">
                  <input
                    type="checkbox"
                    checked={selectedUrls.size === results.length && results.length > 0}
                    onChange={handleSelectAll}
                    style={{ accentColor: 'var(--accent)', cursor: 'pointer', margin: 0 }}
                  />
                  <span>Select all ({selectedUrls.size}/{results.length})</span>
                </label>
                <button type="button" className="btn btn-ghost" style={{ fontSize: '0.68rem', padding: '2px 8px' }} onClick={handleSelectAll}>
                  {selectedUrls.size === results.length ? 'Clear' : 'All'}
                </button>
              </div>

              <div className="discovery-pills">
                <button
                  type="button"
                  className={`discovery-pill ${filterType === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterType('all')}
                >
                  All ({results.length})
                </button>
                {webCount > 0 && (
                  <button
                    type="button"
                    className={`discovery-pill ${filterType === 'web' ? 'active' : ''}`}
                    onClick={() => setFilterType('web')}
                  >
                    Web ({webCount})
                  </button>
                )}
                {ytCount > 0 && (
                  <button
                    type="button"
                    className={`discovery-pill ${filterType === 'youtube' ? 'active' : ''}`}
                    onClick={() => setFilterType('youtube')}
                  >
                    YouTube ({ytCount})
                  </button>
                )}
              </div>
            </div>

            <div className="discovery-list">
              {filteredResults.map((res, i) => {
                const isYT = isYouTube(res.url, res.source);
                const isSelected = selectedUrls.has(res.url);
                return (
                  <div
                    key={i}
                    className={`discovery-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => toggleSelection(res.url)}
                  >
                    <div className="discovery-item-icon">
                      {isYT ? <PlayCircle size={15} color="#ef4444" /> : <Globe size={15} />}
                    </div>
                    <div className="discovery-item-content">
                      <div className="discovery-item-title">{res.title || 'Untitled Source'}</div>
                      {res.snippet && <div className="discovery-item-snippet">{res.snippet}</div>}
                    </div>
                    <div className="discovery-checkbox">
                      {isSelected && <Check size={12} className="check-mark" />}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div className="discovery-footer">
        <div className="selected-count">{selectedUrls.size} selected</div>
        <button
          className="btn btn-primary"
          style={{ padding: '6px 14px', fontSize: '0.78rem' }}
          disabled={selectedUrls.size === 0 || loading}
          onClick={handleImport}
        >
          Import {selectedUrls.size > 0 ? `(${selectedUrls.size})` : ''}
        </button>
      </div>
    </div>
  );
}
