import React from 'react';
import { StopCircle } from 'lucide-react';

export default function ChatControls({ onStop, loading }) {
  if (!loading) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 16px',
        borderBottom: '1px solid rgba(39, 39, 42, 0.8)',
        background: 'rgba(24, 24, 27, 0.6)',
        backdropFilter: 'blur(8px)',
        justifyContent: 'flex-end',
      }}
    >
      <button
        type="button"
        onClick={onStop}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#f87171',
          padding: '4px 10px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: '0.74rem',
          outline: 'none',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
      >
        <StopCircle size={13} />
        <span>Stop Generation</span>
      </button>
    </div>
  );
}
