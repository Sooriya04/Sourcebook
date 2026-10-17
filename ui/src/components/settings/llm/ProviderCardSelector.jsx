import React from 'react';
import { Check } from 'lucide-react';

const PROVIDER_OPTIONS = [
  { id: 'openai', label: 'OpenAI Compatible', desc: 'Custom local / cloud endpoints' },
  { id: 'ollama', label: 'Ollama Native', desc: 'Local http://localhost:11434' },
  { id: 'groq', label: 'Groq Cloud', desc: 'Fast LPUs (api.groq.com)' },
  { id: 'nvidia', label: 'NVIDIA NIM', desc: 'Cloud NIM endpoints' }
];

export default function ProviderCardSelector({ provider, onSelectProvider }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        marginBottom: '24px'
      }}
    >
      {PROVIDER_OPTIONS.map((p) => {
        const isSelected = provider === p.id;
        return (
          <div
            key={p.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelectProvider(p.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelectProvider(p.id);
              }
            }}
            style={{
              padding: '14px 16px',
              borderRadius: '10px',
              border: isSelected ? '1px solid #6366f1' : '1px solid #27272a',
              backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : '#121214',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '74px'
            }}
            onMouseEnter={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = '#18181b';
                e.currentTarget.style.borderColor = '#3f3f46';
              }
            }}
            onMouseLeave={(e) => {
              if (!isSelected) {
                e.currentTarget.style.backgroundColor = '#121214';
                e.currentTarget.style.borderColor = '#27272a';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  letterSpacing: '-0.01em',
                  color: isSelected ? '#ffffff' : '#e4e4e7'
                }}
              >
                {p.label}
              </span>
              {isSelected && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#6366f1',
                    color: '#ffffff'
                  }}
                >
                  <Check size={10} strokeWidth={3} />
                </span>
              )}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#71717a', lineHeight: 1.3 }}>
              {p.desc}
            </div>
          </div>
        );
      })}
    </div>
  );
}
