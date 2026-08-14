import React from 'react';
import { Cpu, Search, Sparkles } from 'lucide-react';

export default function ThinkingIndicator({ phase = 'retrieving' }) {
  const isSynthesizing = phase === 'synthesizing';

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
          {isSynthesizing 
            ? 'Synthesizing grounded answer...' 
            : 'Searching & reranking workspace sources...'}
        </span>
      </div>
    </div>
  );
}
