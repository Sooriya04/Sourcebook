import React, { useState } from 'react';
import { ArrowRight, Layers, Sliders, X, PlusCircle } from 'lucide-react';

export default function PromptBar({ onSend, loading, allSources = [], sourceCount = 0 }) {
  const [query, setQuery] = useState('');
  const [scopedSourceIds, setScopedSourceIds] = useState([]);
  const [showPopover, setShowPopover] = useState(false);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;
    onSend(query, scopedSourceIds);
    setQuery('');
    setScopedSourceIds([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleSourceScope = (id) => {
    setScopedSourceIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getSourceTitle = (id) => {
    const src = allSources.find(s => s.id === id || s.url === id || s.index === id);
    return src ? src.title : `Source ${id}`;
  };

  return (
    <div className="prompt-area">
      {/* Scoped Sources Pills Row */}
      {scopedSourceIds.length > 0 && (
        <div className="prompt-scoped-pills-row">
          <span className="scoping-label">Scoped to:</span>
          {scopedSourceIds.map(id => (
            <span key={id} className="scoped-source-pill">
              <span>{getSourceTitle(id)}</span>
              <button 
                type="button" 
                className="remove-scoped-btn"
                onClick={() => toggleSourceScope(id)}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}

      <form className="prompt-bar" onSubmit={handleSubmit}>
        <textarea
          className="prompt-input"
          placeholder="Ask a question or create something..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        
        <div className="prompt-controls-right">
          {/* Scope Selector Trigger */}
          <div className="scope-selector-container">
            <button
              type="button"
              className={`scope-trigger-btn ${scopedSourceIds.length > 0 ? 'active' : ''}`}
              onClick={() => setShowPopover(!showPopover)}
              title="Scope query to specific sources"
            >
              <PlusCircle size={14} />
              <span>Scope</span>
            </button>

            {showPopover && (
              <div className="scope-popover">
                <div className="scope-popover-header">
                  <span>Scope Workspace Sources</span>
                  <button type="button" onClick={() => setShowPopover(false)}>
                    <X size={12} />
                  </button>
                </div>
                <div className="scope-popover-list">
                  {allSources.map(src => {
                    const srcId = src.id || src.url;
                    const isSelected = scopedSourceIds.includes(srcId);
                    return (
                      <label key={srcId} className="scope-item-row">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSourceScope(srcId)}
                        />
                        <span className="scope-item-title" title={src.title}>
                          [{src.index}] {src.title}
                        </span>
                      </label>
                    );
                  })}
                  {allSources.length === 0 && (
                    <div className="scope-popover-empty">
                      No sources available in workspace.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="sources-count-pill" title="Active notebook sources indexed">
            <Layers size={13} />
            <span>{sourceCount} {sourceCount === 1 ? 'source' : 'sources'}</span>
          </div>

          <button
            type="submit"
            className="circular-send-btn"
            disabled={!query.trim() || loading}
            title="Send query"
          >
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
