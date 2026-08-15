import React from 'react';
import { Cpu, Search, Sparkles } from 'lucide-react';

export default function ThinkingIndicator({ phase = 'retrieving' }) {
  const isSynthesizing = phase === 'synthesizing';
  const isRetrieving = phase === 'retrieving';

  let statusText = 'Searching & reranking workspace sources...';
  if (isSynthesizing) {
    statusText = 'Synthesizing grounded answer...';
  } else if (!isRetrieving) {
    statusText = phase;
  }

  return (
    <div className="message-card thinking">
      <div className="avatar ai pulse">
        {isSynthesizing ? <Sparkles size={18} /> : <Search size={18} />}
      </div>
      <div className="message-content-box thinking-text">
        <div className="thinking-dots">
          <span></span><span></span><span></span>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {statusText}
        </span>
      </div>
    </div>
  );
}
