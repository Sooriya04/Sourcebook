import React from 'react';
import { ArrowUp, Square, X } from 'lucide-react';

export default function PromptActionButtons({ query, loading, onClear, onStop }) {
  const canSend = Boolean(query?.trim());

  return (
    <div className="chat-composer-actions">
      {query && !loading && (
        <button
          type="button"
          onClick={onClear}
          title="Clear input"
          aria-label="Clear input"
          className="chat-composer-clear-btn"
        >
          <X size={14} />
        </button>
      )}

      {loading ? (
        <button
          type="button"
          onClick={onStop}
          title="Stop generating (Esc)"
          aria-label="Stop generating"
          className="chat-composer-stop-btn"
        >
          <Square size={11} fill="currentColor" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={!canSend}
          title="Send query (Enter)"
          aria-label="Send query"
          className={`chat-composer-send-btn ${canSend ? 'enabled' : ''}`}
        >
          <ArrowUp size={15} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
}
