import React from 'react';
import { Layers } from 'lucide-react';

export default function EmbeddingSettingsTab({ settings, onChange }) {
  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '12px',
    backgroundColor: '#131314',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    color: '#e3e3e3',
    fontSize: '0.84rem',
    fontFamily: "'IBM Plex Mono', 'JetBrains Mono', ui-monospace, monospace",
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
  };

  const handleFocus = (e) => {
    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
    e.currentTarget.style.boxShadow = '0 0 0 2px rgba(168, 199, 250, 0.25)';
  };

  const handleBlur = (e) => {
    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <div
        style={{
          backgroundColor: '#1e1f20',
          padding: '24px',
          borderRadius: '24px',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <h3
            style={{
              fontSize: '0.94rem',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#e3e3e3',
              margin: '0 0 4px 0'
            }}
          >
            <Layers size={16} color="#a8c7fa" />
            <span>Vector Embeddings & Semantic Index</span>
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#8e918f', margin: 0 }}>
            Configure dense vector models for chunk embeddings, semantic reranking, and context retrieval.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#d4d4d8' }}>
                Embedding Provider
              </label>
              <span style={{ fontSize: '0.72rem', color: '#71717a' }}>
                Vector computation backend
              </span>
            </div>
            <select
              value={settings.embedding_provider || 'local'}
              onChange={(e) => onChange('embedding_provider', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            >
              <option value="local">Local Python Sentence-Transformers (Built-in)</option>
              <option value="ollama">Ollama Embeddings API</option>
              <option value="openai">OpenAI / Compatible Embeddings API</option>
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#d4d4d8' }}>
                Embedding Endpoint URL
              </label>
              <span style={{ fontSize: '0.72rem', color: '#71717a' }}>
                Leave blank if using local provider
              </span>
            </div>
            <input
              type="text"
              value={settings.embedding_url || ''}
              onChange={(e) => onChange('embedding_url', e.target.value)}
              placeholder="http://localhost:11434 (leave blank for local)"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#d4d4d8' }}>
                Embedding Model Name
              </label>
              <span style={{ fontSize: '0.72rem', color: '#71717a' }}>
                Target model weights identifier
              </span>
            </div>
            <input
              type="text"
              value={settings.embedding_model || 'nomic-embed-text'}
              onChange={(e) => onChange('embedding_model', e.target.value)}
              placeholder="nomic-embed-text"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
