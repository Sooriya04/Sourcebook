import React from 'react';
import { Zap, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import Spinner from '../ui/Spinner';

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
    { id: 'openai', label: 'OpenAI Compatible', desc: 'Custom local / cloud endpoints' },
    { id: 'ollama', label: 'Ollama Native', desc: 'Local http://localhost:11434' },
    { id: 'groq', label: 'Groq Cloud', desc: 'Fast LPUs (api.groq.com)' },
    { id: 'nvidia', label: 'NVIDIA NIM', desc: 'Cloud NIM endpoints' }
  ];

  const meta = DEFAULT_PROVIDER_CONFIGS[provider] || DEFAULT_PROVIDER_CONFIGS.openai;
  const current = (providerConfigs && providerConfigs[provider]) || meta;

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
          <Zap size={16} color="#818cf8" />
          <span>Provider Protocol</span>
        </h3>

        {/* Provider Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '10px',
            marginBottom: '20px'
          }}
        >
          {providers.map((p) => {
            const isSelected = provider === p.id;
            return (
              <div
                key={p.id}
                role="button"
                tabIndex={0}
                onClick={() => setProvider(p.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setProvider(p.id);
                  }
                }}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: isSelected
                    ? '1.5px solid #6366f1'
                    : '1px solid #27272a',
                  backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.08)' : '#18181b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#202024';
                    e.currentTarget.style.borderColor = '#3f3f46';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = '#18181b';
                    e.currentTarget.style.borderColor = '#27272a';
                  }
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    color: isSelected ? '#ffffff' : '#d4d4d8',
                    marginBottom: '2px'
                  }}
                >
                  {p.label}
                </div>
                <div style={{ fontSize: '0.72rem', color: '#71717a' }}>{p.desc}</div>
              </div>
            );
          })}
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 500,
                marginBottom: '6px',
                color: '#a1a1aa'
              }}
            >
              Base Endpoint URL
            </label>
            <input
              type="text"
              value={current.baseUrl ?? meta.baseUrl}
              onChange={(e) => onChangeConfig(provider, 'baseUrl', e.target.value)}
              placeholder={meta.placeholderUrl}
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
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 500,
                marginBottom: '6px',
                color: '#a1a1aa'
              }}
            >
              Target Model Name
            </label>
            <input
              type="text"
              value={current.model ?? meta.model}
              onChange={(e) => onChangeConfig(provider, 'model', e.target.value)}
              placeholder={meta.placeholderModel}
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
            <label
              style={{
                display: 'block',
                fontSize: '0.78rem',
                fontWeight: 500,
                marginBottom: '6px',
                color: '#a1a1aa'
              }}
            >
              API Key
            </label>
            <input
              type="password"
              value={current.apiKey ?? ''}
              onChange={(e) => onChangeConfig(provider, 'apiKey', e.target.value)}
              placeholder={meta.placeholderKey}
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
        </div>

        {/* Test Connection Button & Status */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #27272a',
            flexWrap: 'wrap'
          }}
        >
          <button
            type="button"
            onClick={onTestConnection}
            disabled={testingKey}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              backgroundColor: '#27272a', // zinc-800
              border: '1px solid #3f3f46', // zinc-700
              color: '#f4f4f5',
              borderRadius: '8px',
              cursor: testingKey ? 'not-allowed' : 'pointer',
              fontWeight: 500,
              fontSize: '0.82rem',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!testingKey) {
                e.currentTarget.style.backgroundColor = '#3f3f46';
                e.currentTarget.style.borderColor = '#52525b';
              }
            }}
            onMouseLeave={(e) => {
              if (!testingKey) {
                e.currentTarget.style.backgroundColor = '#27272a';
                e.currentTarget.style.borderColor = '#3f3f46';
              }
            }}
          >
            {testingKey ? <Spinner size={14} color="#818cf8" /> : <ShieldCheck size={14} color="#818cf8" />}
            <span>{testingKey ? 'Verifying Endpoint...' : 'Test Connection & Key'}</span>
          </button>

          {testStatus && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
                padding: '5px 12px',
                borderRadius: '6px',
                backgroundColor: testStatus.valid ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                border: testStatus.valid ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
                color: testStatus.valid ? '#6ee7b7' : '#fca5a5'
              }}
            >
              {testStatus.valid ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
              <span>{testStatus.valid ? testStatus.message : testStatus.error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
