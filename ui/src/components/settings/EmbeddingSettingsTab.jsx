import React from 'react';
import { Layers } from 'lucide-react';

export default function EmbeddingSettingsTab({ settings, onChange }) {
  const inputStyle = {
    width: '100%',
    padding: '9px 12px',
    borderRadius: '8px',
    backgroundColor: '#09090b', // zinc-950
    border: '1px solid #27272a', // zinc-800
    color: '#f4f4f5',
    fontSize: '0.86rem',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '820px' }}>
      <div
        style={{
          backgroundColor: '#18181b', // zinc-900
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #27272a'
        }}
      >
        <h3
          style={{
            fontSize: '0.94rem',
            fontWeight: 600,
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#f4f4f5'
          }}
        >
          <Layers size={16} color="#818cf8" />
          <span>Vector Embeddings & Similarity Index</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
              Embedding Provider
            </label>
            <select
              value={settings.embedding_provider || 'local'}
              onChange={(e) => onChange('embedding_provider', e.target.value)}
              style={inputStyle}
            >
              <option value="local">Local Python Sentence-Transformers (Built-in)</option>
              <option value="ollama">Ollama Embeddings API</option>
              <option value="openai">OpenAI / Compatible Embeddings API</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
              Embedding Endpoint URL
            </label>
            <input
              type="text"
              value={settings.embedding_url || ''}
              onChange={(e) => onChange('embedding_url', e.target.value)}
              placeholder="http://localhost:11434 (leave blank for local)"
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.25)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#27272a';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
              Embedding Model Name
            </label>
            <input
              type="text"
              value={settings.embedding_model || 'nomic-embed-text'}
              onChange={(e) => onChange('embedding_model', e.target.value)}
              placeholder="nomic-embed-text"
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#6366f1';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.25)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#27272a';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <span style={{ fontSize: '0.72rem', color: '#71717a', display: 'block', marginTop: '4px' }}>
              Used for semantic reranking, notebook document chunking, and memory retrieval.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
