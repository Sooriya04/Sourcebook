import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import DiscoveryResultCard from './DiscoveryResultCard';
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
        console.error('Search failed:', err);
        if (isMounted) { setResults([]); setLoading(false); }
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
    if (next.has(url)) next.delete(url); else next.add(url);
    setSelectedUrls(next);
  };

  const handleSelectAll = () => {
    setSelectedUrls(selectedUrls.size === results.length ? new Set() : new Set(results.map(r => r.url)));
  };

  const handleImport = () => {
    const sourcesToImport = results
      .filter(r => selectedUrls.has(r.url))
      .map(r => ({ title: r.title, url: r.url, type: isYouTube(r.url, r.source) ? 'youtube' : 'web' }));
    if (sourcesToImport.length > 0) onImport(sourcesToImport);
  };

  const ytCount = results.filter(r => isYouTube(r.url, r.source)).length;
  const webCount = results.length - ytCount;

  return (
    <div className="discovery-panel-tasteful">
      <div className="discovery-header-row">
        <button type="button" className="discovery-back-btn" onClick={onCancel}>
          <ArrowLeft size={13} />
          <span>Back</span>
        </button>
        <span className="discovery-header-badge">Web Discovery</span>
      </div>

      <div className="discovery-results-wrapper">
        {loading ? (
          <div className="discovery-loading-state">
            <Loader2 size={24} className="spin text-zinc-400" />
            <span className="text-zinc-400 text-xs">Discovering relevant sources...</span>
          </div>
        ) : (
          <>
            <div className="discovery-filter-toolbar">
              <label className="discovery-select-all-label">
                <input
                  type="checkbox"
                  checked={selectedUrls.size === results.length && results.length > 0}
                  onChange={handleSelectAll}
                  className="discovery-checkbox-input"
                />
                <span>Select all ({selectedUrls.size}/{results.length})</span>
              </label>

              <div className="discovery-pills-row">
                {['all', 'web', 'youtube'].map(type => {
                  if (type === 'web' && webCount === 0) return null;
                  if (type === 'youtube' && ytCount === 0) return null;
                  const label = type === 'all' ? `All (${results.length})` : type === 'web' ? `Web (${webCount})` : `YouTube (${ytCount})`;
                  return (
                    <button
                      key={type}
                      type="button"
                      className={`discovery-pill-btn ${filterType === type ? 'active' : ''}`}
                      onClick={() => setFilterType(type)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="discovery-cards-list">
              {filteredResults.map((res, i) => (
                <DiscoveryResultCard
                  key={res.url || i}
                  result={res}
                  isSelected={selectedUrls.has(res.url)}
                  onToggle={toggleSelection}
                  isYouTube={isYouTube}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="discovery-footer-row">
        <span className="discovery-count-text">{selectedUrls.size} of {results.length} selected</span>
        <div className="discovery-footer-btns">
          <button type="button" onClick={onCancel} className="discovery-btn-cancel">Cancel</button>
          <button
            type="button"
            disabled={selectedUrls.size === 0 || loading}
            onClick={handleImport}
            className={`discovery-btn-import ${selectedUrls.size > 0 ? 'active' : ''}`}
          >
            Import Sources
          </button>
        </div>
      </div>
    </div>
  );
}
