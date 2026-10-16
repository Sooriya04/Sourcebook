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
    <div
      className="thinking-row"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 14px',
        margin: '10px 0',
        borderRadius: '12px',
        background: 'rgba(24, 24, 27, 0.75)',
        border: '1px solid rgba(39, 39, 42, 0.8)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <div
        style={{
          width: '24px',
          height: '24px',
          borderRadius: '7px',
          background: 'rgba(99, 102, 241, 0.12)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          color: '#818cf8',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        {isSynthesizing ? <Sparkles size={13} /> : <Search size={13} />}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          <span className="thinking-pulse-dot" style={{ animationDelay: '0ms' }} />
          <span className="thinking-pulse-dot" style={{ animationDelay: '180ms' }} />
          <span className="thinking-pulse-dot" style={{ animationDelay: '360ms' }} />
        </div>
        <span
          style={{
            fontSize: '0.78rem',
            color: '#a1a1aa',
            fontWeight: 500,
            letterSpacing: '0.01em',
          }}
        >
          {statusText}
        </span>
      </div>

      <style>{`
        .thinking-pulse-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #818cf8;
          animation: thinkingPulse 1.2s infinite ease-in-out;
        }
        @keyframes thinkingPulse {
          0%, 100% {
            transform: scale(0.6);
            opacity: 0.35;
          }
          50% {
            transform: scale(1.15);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
