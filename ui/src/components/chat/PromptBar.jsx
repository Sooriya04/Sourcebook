import React, { useState } from 'react';
import { Send, Globe } from 'lucide-react';

export default function PromptBar({ onSend, loading, maxSources, setMaxSources }) {
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
          className="prompt-input"
          placeholder="Ask SourceBook anything about your sources or web knowledge..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <div className="prompt-actions">
          <div className="controls-group">
            <Globe size={14} color="var(--text-main)" />
            <span>Max Sources:</span>
            <select
              className="select-control"
              value={maxSources}
              onChange={(e) => setMaxSources(Number(e.target.value))}
            >
              <option value={3}>3 Sources</option>
              <option value={5}>5 Sources</option>
              <option value={8}>8 Sources</option>
              <option value={10}>10 Sources</option>
            </select>
          </div>

          <button
            type="submit"
            className="send-btn"
            disabled={!query.trim() || loading}
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
