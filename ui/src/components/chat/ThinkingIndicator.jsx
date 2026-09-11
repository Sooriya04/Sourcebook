import React from 'react';
import { Search, Sparkles } from 'lucide-react';

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
    <div 
      className="thinking-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '10px 4px',
        margin: '8px 0',
        width: '100%',
        animation: 'messageSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      <div style={{
        width: '22px',
        height: '22px',
        borderRadius: '6px',
        background: 'var(--canvas-2)',
        border: '1px solid var(--border-color)',
        color: 'var(--accent-primary)',
        display: 'grid',
        placeItems: 'center'
      }}>
        {isSynthesizing ? <Sparkles size={12} /> : <Search size={12} />}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span className="dot" style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-primary)', animation: 'pulseDot 1.2s infinite ease-in-out' }}></span>
          <span className="dot" style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-primary)', animation: 'pulseDot 1.2s infinite ease-in-out 0.2s' }}></span>
          <span className="dot" style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'var(--accent-primary)', animation: 'pulseDot 1.2s infinite ease-in-out 0.4s' }}></span>
        </div>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {statusText}
        </span>
      </div>

      <style>{`
        @keyframes pulseDot {
          0%, 100% { transform: scale(0.6); opacity: 0.3; }
          50% { transform: scale(1.2); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
