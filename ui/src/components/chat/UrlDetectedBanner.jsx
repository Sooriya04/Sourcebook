import React from 'react';
import { Globe, X } from 'lucide-react';

export default function UrlDetectedBanner({ url, onIngest, onDismiss }) {
  if (!url) return null;

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        right: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        background: 'rgba(24, 24, 27, 0.95)',
        border: '1px solid rgba(99, 102, 241, 0.4)',
        borderRadius: '16px',
        padding: '4px 10px',
        fontSize: '0.72rem',
        color: '#f4f4f5',
        zIndex: 40,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      <Globe size={13} color="#818cf8" style={{ flexShrink: 0 }} />
      <span style={{ color: '#d4d4d8', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        Link detected
      </span>

      <button
        type="button"
        onClick={() => onIngest(url)}
        style={{
          background: '#4f46e5',
          color: '#ffffff',
          border: 'none',
          borderRadius: '10px',
          padding: '2px 8px',
          fontSize: '0.68rem',
          fontWeight: 600,
          cursor: 'pointer',
          outline: 'none',
          transition: 'background-color 0.12s ease',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = '#6366f1'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = '#4f46e5'; }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.96)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        + Ingest Source
      </button>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          style={{ background: 'transparent', border: 'none', color: '#71717a', cursor: 'pointer', padding: '2px', display: 'grid', placeItems: 'center' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#f4f4f5'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#71717a'; }}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
