import React from 'react';
import { Trash2, RotateCcw, StopCircle, RefreshCw } from 'lucide-react';

export default function ChatControls({ onStop, loading }) {
  if (!loading) return null;

  return (
    <div className="chat-controls" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      borderBottom: '1px solid var(--border-color)',
      background: 'rgba(255, 255, 255, 0.02)',
      backdropFilter: 'blur(8px)',
      justifyContent: 'flex-end',
      fontSize: '0.85rem'
    }}>
      <button 
        onClick={onStop}
        className="chat-control-btn stop-btn"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          padding: '6px 12px',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: 500,
          fontSize: '0.8rem',
          transition: 'all 0.2s ease'
        }}
      >
        <StopCircle size={14} />
        Stop Generation
      </button>
    </div>
  );
}
