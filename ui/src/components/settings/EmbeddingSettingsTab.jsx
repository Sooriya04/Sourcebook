import React from 'react';
import { Layers } from 'lucide-react';

export default function EmbeddingSettingsTab({ settings, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={18} color="var(--accent-primary)" /> Vector Embeddings & Similarity Index
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-dim)' }}>
              Embedding Provider
            </label>
            <select
              value={settings.embedding_provider || 'local'}
              onChange={(e) => onChange('embedding_provider', e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
            >
              <option value="local">Local Python Sentence-Transformers (Built-in)</option>
              <option value="ollama">Ollama Embeddings API</option>
              <option value="openai">OpenAI / Compatible Embeddings API</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-dim)' }}>
              Embedding Endpoint URL
            </label>
            <input
              type="text"
              value={settings.embedding_url || ''}
              onChange={(e) => onChange('embedding_url', e.target.value)}
              placeholder="http://localhost:11434 (leave blank for local)"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-dim)' }}>
              Embedding Model Name
            </label>
            <input
              type="text"
              value={settings.embedding_model || 'nomic-embed-text'}
              onChange={(e) => onChange('embedding_model', e.target.value)}
              placeholder="nomic-embed-text"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
            />
            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block', marginTop: '4px' }}>
              Used for semantic reranking, notebook document chunking, and memory retrieval.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
