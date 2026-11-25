import React from 'react';
import { Search, Sparkles } from 'lucide-react';

export default function ThinkingIndicator({ phase = 'retrieving' }) {
  const isSynthesizing = phase === 'synthesizing';
  const isRetrieving = phase === 'retrieving';

  let statusText = 'Searching & reranking workspace sources...';
  if (isSynthesizing) {
    statusText = 'Synthesizing grounded answer...';
  } else if (!isRetrieving && phase) {
    statusText = phase;
  }

  return (
    <div className="chat-thinking-row" role="status" aria-live="polite">
      <div className="chat-thinking-icon">
        {isSynthesizing ? <Sparkles size={12} /> : <Search size={12} />}
      </div>

      <div className="chat-thinking-dots" aria-hidden="true">
        <span className="thinking-pulse-dot" style={{ animationDelay: '0ms' }} />
        <span className="thinking-pulse-dot" style={{ animationDelay: '180ms' }} />
        <span className="thinking-pulse-dot" style={{ animationDelay: '360ms' }} />
      </div>

      <span className="chat-thinking-text">{statusText}</span>
    </div>
  );
}
