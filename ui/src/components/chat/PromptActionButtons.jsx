import React from 'react';
import { ArrowUp, Square, X } from 'lucide-react';

export default function PromptActionButtons({ query, loading, onClear, onStop }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
      {query && !loading && (
        <button
          type="button"
          onClick={onClear}
          title="Clear text"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#71717a',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '50%',
            display: 'grid',
            placeItems: 'center',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#f4f4f5'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#71717a'; }}
        >
          <X size={14} />
        </button>
      )}

      {loading ? (
        <button
          type="button"
          onClick={onStop}
          title="Stop generating (Esc)"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#ef4444',
            color: '#ffffff',
            border: 'none',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            outline: 'none',
            boxShadow: '0 0 10px rgba(239, 68, 68, 0.45)',
          }}
          onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
          onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <Square size={12} fill="#ffffff" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={!query?.trim()}
          title="Send query (Enter)"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: 'none',
            background: query?.trim() ? '#f4f4f5' : 'rgba(39, 39, 42, 0.6)',
            color: query?.trim() ? '#09090b' : '#52525b',
            display: 'grid',
            placeItems: 'center',
            cursor: query?.trim() ? 'pointer' : 'not-allowed',
            outline: 'none',
            transition: 'all 0.15s ease',
          }}
          onMouseDown={(e) => { if (query?.trim()) e.currentTarget.style.transform = 'scale(0.92)'; }}
          onMouseUp={(e) => { if (query?.trim()) e.currentTarget.style.transform = 'scale(1)'; }}
        >
          <ArrowUp size={16} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
