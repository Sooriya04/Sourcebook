import React, { useEffect, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';

export default function ThinkingIndicator({ phase = 'retrieving' }) {
  const isSynthesizing = phase === 'synthesizing';
  const isRetrieving = phase === 'retrieving';
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(p => !p);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  let statusText = 'Searching & reranking workspace sources...';
  if (isSynthesizing) {
    statusText = 'Synthesizing grounded answer...';
  } else if (!isRetrieving) {
    statusText = phase;
  }

  return (
    <div 
      className="message-card thinking"
      style={{
        display: 'flex',
        gap: '16px',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        background: 'var(--panel)',
        boxShadow: 'var(--shadow)',
        marginBottom: '16px',
        alignItems: 'center'
      }}
    >
      <div 
        className="avatar ai"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          background: 'var(--accent-bg)',
          color: 'var(--accent-primary)',
          transition: 'transform 0.5s ease, background-color 0.5s ease',
          transform: pulse ? 'scale(1.05)' : 'scale(0.95)'
        }}
      >
        {isSynthesizing ? (
          <Sparkles size={16} style={{ color: 'var(--accent-hover)' }} />
        ) : (
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
        )}
      </div>
      
      <div className="message-content-box thinking-text" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div 
          className="thinking-dots"
          style={{
            display: 'flex',
            gap: '4px',
            alignItems: 'center'
          }}
        >
          <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)', animation: 'pulseDot 1.2s infinite ease-in-out' }}></span>
          <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)', animation: 'pulseDot 1.2s infinite ease-in-out 0.2s' }}></span>
          <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-primary)', animation: 'pulseDot 1.2s infinite ease-in-out 0.4s' }}></span>
        </div>
        
        <span 
          style={{ 
            fontSize: '0.86rem', 
            color: 'var(--text-muted)', 
            fontWeight: 500,
            fontFamily: 'var(--font-sans)',
            letterSpacing: '0.01em'
          }}
        >
          {statusText}
        </span>
      </div>
      
      <style>{`
        @keyframes pulseDot {
          0%, 100% { transform: scale(0.6); opacity: 0.4; }
          50% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
