import React, { useState } from 'react';
import { Send } from 'lucide-react';

export default function PromptBar({ onSend, loading }) {
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
          placeholder="Ask SourceBook anything..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        <div className="prompt-actions">
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
