import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function ProviderInputFields({ provider, currentConfig, meta, onChangeConfig }) {
  const [showKey, setShowKey] = useState(false);

  const inputStyle = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    backgroundColor: '#09090b',
    border: '1px solid #27272a',
    color: '#f4f4f5',
    fontSize: '0.84rem',
    fontFamily: "'IBM Plex Mono', 'JetBrains Mono', ui-monospace, monospace",
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
  };

  const handleFocus = (e) => {
    e.currentTarget.style.borderColor = '#6366f1';
    e.currentTarget.style.boxShadow = '0 0 0 1px #6366f1';
  };

  const handleBlur = (e) => {
    e.currentTarget.style.borderColor = '#27272a';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
      {/* Base Endpoint URL */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#d4d4d8' }}>
            Base Endpoint URL
          </label>
          <span style={{ fontSize: '0.72rem', color: '#71717a' }}>
            HTTP / HTTPS root
          </span>
        </div>
        <input
          type="text"
          value={currentConfig.baseUrl ?? meta.baseUrl}
          onChange={(e) => onChangeConfig(provider, 'baseUrl', e.target.value)}
          placeholder={meta.placeholderUrl}
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      {/* Target Model Name */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#d4d4d8' }}>
            Target Model Name
          </label>
          <span style={{ fontSize: '0.72rem', color: '#71717a' }}>
            Model architecture identifier
          </span>
        </div>
        <input
          type="text"
          value={currentConfig.model ?? meta.model}
          onChange={(e) => onChangeConfig(provider, 'model', e.target.value)}
          placeholder={meta.placeholderModel}
          style={inputStyle}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>

      {/* API Key */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#d4d4d8' }}>
            API Key
          </label>
          <span style={{ fontSize: '0.72rem', color: '#71717a' }}>
            {provider === 'ollama' ? 'Optional for local daemon' : 'Bearer credential token'}
          </span>
        </div>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <input
            type={showKey ? 'text' : 'password'}
            value={currentConfig.apiKey ?? ''}
            onChange={(e) => onChangeConfig(provider, 'apiKey', e.target.value)}
            placeholder={meta.placeholderKey}
            style={{ ...inputStyle, paddingRight: '40px' }}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            title={showKey ? 'Hide key' : 'Show key'}
            style={{
              position: 'absolute',
              right: '10px',
              background: 'transparent',
              border: 'none',
              color: '#71717a',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '4px',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#f4f4f5'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#71717a'; }}
          >
            {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>
      </div>
    </div>
  );
}
