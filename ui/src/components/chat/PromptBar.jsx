import React, { useState, forwardRef } from 'react';
import { ArrowRight, Layers } from 'lucide-react';

const PromptBar = forwardRef(function PromptBar(
  { onSend, loading, sourceCount = 0 }, 
  ref
) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;
    onSend(query);
    setQuery('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="prompt-area">
      <form className="prompt-bar" onSubmit={handleSubmit}>
        <textarea
          ref={ref}
          className="prompt-input"
          placeholder="Ask a question or create something... (⌘K to focus)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        
        <div className="prompt-controls-right">
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
});

export default PromptBar;
