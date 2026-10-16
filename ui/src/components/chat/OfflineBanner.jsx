import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OfflineBanner({ onDismiss }) {
  const navigate = useNavigate();

  return (
    <div
      role="alert"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        borderRadius: '8px',
        padding: '6px 12px',
        margin: '8px 16px 0',
        fontSize: '0.74rem',
        color: '#f87171',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <AlertCircle size={13} style={{ flexShrink: 0 }} />
        <span>LLM provider is offline. Check connection in Settings.</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          style={{
            background: '#ef4444',
            color: '#ffffff',
            border: 'none',
            borderRadius: '4px',
            padding: '2px 8px',
            fontSize: '0.68rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Settings
        </button>
        <button
          type="button"
          onClick={onDismiss}
          style={{ background: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: '2px', display: 'grid', placeItems: 'center' }}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}
