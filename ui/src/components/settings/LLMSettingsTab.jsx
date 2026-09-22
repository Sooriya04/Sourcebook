import React from 'react';
import { Zap, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';

export const DEFAULT_PROVIDER_CONFIGS = {
  openai: {
    baseUrl: 'http://localhost:20128/v1',
    model: 'ag/gemini-3.6-flash-low',
    apiKey: '',
    placeholderUrl: 'http://localhost:20128/v1',
    placeholderModel: 'ag/gemini-3.6-flash-low',
    placeholderKey: 'sk-... (optional for local proxy)'
  },
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'gemma2',
    apiKey: '',
    placeholderUrl: 'http://localhost:11434',
    placeholderModel: 'gemma2, llama3, qwen2.5',
    placeholderKey: 'Not required for local Ollama'
  },
  groq: {
    baseUrl: 'https://api.groq.com/openai/v1',
    model: 'llama-3.3-70b-versatile',
    apiKey: '',
    placeholderUrl: 'https://api.groq.com/openai/v1',
    placeholderModel: 'llama-3.3-70b-versatile',
    placeholderKey: 'gsk_...'
  },
  nvidia: {
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    model: 'meta/llama-3.1-70b-instruct',
    apiKey: '',
    placeholderUrl: 'https://integrate.api.nvidia.com/v1',
    placeholderModel: 'meta/llama-3.1-70b-instruct',
    placeholderKey: 'nvapi-...'
  }
};

export default function LLMSettingsTab({
  provider,
  setProvider,
  providerConfigs,
  onChangeConfig,
  testingKey,
  testStatus,
  onTestConnection
}) {
  const providers = [
    { id: 'openai', label: 'OpenAI Compatible', desc: 'Custom local/cloud endpoints' },
    { id: 'ollama', label: 'Ollama Native', desc: 'Local http://localhost:11434' },
    { id: 'groq', label: 'Groq Cloud', desc: 'Fast LPUs (api.groq.com)' },
    { id: 'nvidia', label: 'NVIDIA NIM', desc: 'Cloud NIM endpoints' }
  ];

  const meta = DEFAULT_PROVIDER_CONFIGS[provider] || DEFAULT_PROVIDER_CONFIGS.openai;
  const current = (providerConfigs && providerConfigs[provider]) || meta;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <div style={{ background: 'var(--bg-card)', padding: '20px 24px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Zap size={16} color="var(--accent-primary)" /> Provider Protocol
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '18px' }}>
          {providers.map(p => (
            <div
              key={p.id}
              onClick={() => setProvider(p.id)}
              style={{
                padding: '10px 14px',
                borderRadius: '6px',
                border: provider === p.id ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                background: provider === p.id ? 'var(--bg-hover)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '2px' }}>{p.label}</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{p.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-dim)' }}>
              Base Endpoint URL
            </label>
            <input
              type="text"
              value={current.baseUrl ?? meta.baseUrl}
              onChange={(e) => onChangeConfig(provider, 'baseUrl', e.target.value)}
              placeholder={meta.placeholderUrl}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-dim)' }}>
              Target Model Name
            </label>
            <input
              type="text"
              value={current.model ?? meta.model}
              onChange={(e) => onChangeConfig(provider, 'model', e.target.value)}
              placeholder={meta.placeholderModel}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-dim)' }}>
              API Key
            </label>
            <input
              type="password"
              value={current.apiKey ?? ''}
              onChange={(e) => onChangeConfig(provider, 'apiKey', e.target.value)}
              placeholder={meta.placeholderKey}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={onTestConnection}
            disabled={testingKey}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'var(--bg-hover)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 500,
              fontSize: '0.8rem'
            }}
          >
            <ShieldCheck size={14} color="var(--accent-primary)" />
            {testingKey ? 'Verifying Endpoint...' : 'Test Connection & Key'}
          </button>

          {testStatus && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              padding: '4px 10px',
              borderRadius: '6px',
              background: testStatus.valid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: testStatus.valid ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
              color: testStatus.valid ? '#10b981' : '#ef4444'
            }}>
              {testStatus.valid ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              <span>{testStatus.valid ? testStatus.message : testStatus.error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
