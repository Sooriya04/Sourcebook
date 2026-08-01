import React from 'react';
import { Sparkles } from 'lucide-react';

export default function ThinkingIndicator() {
  return (
    <div className="message-card thinking">
      <div className="avatar ai pulse">
        <Sparkles size={18} />
      </div>
      <div className="message-content-box thinking-text">
        <div className="thinking-dots">
          <span></span><span></span><span></span>
        </div>
        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Searching SearXNG & synthesizing grounded answer...
        </span>
      </div>
    </div>
  );
}
