import React from 'react';
import { Search } from 'lucide-react';

export default function SearchSettingsTab({ settings, onChange }) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <div
        style={{
          backgroundColor: '#18181b',
          padding: '24px',
          borderRadius: '12px',
          border: '1px solid #27272a'
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <h3
            style={{
              fontSize: '0.94rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#f4f4f5',
              margin: '0 0 4px 0'
            }}
          >
            <Search size={16} color="#818cf8" />
            <span>Search Discovery Engine & Routing</span>
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#71717a', margin: 0 }}>
            Configure live web discovery providers and metasearch query parameters.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#d4d4d8' }}>
                Primary Discovery Provider
              </label>
              <span style={{ fontSize: '0.72rem', color: '#71717a' }}>
                Search indexing method
              </span>
            </div>
            <select
              value={settings.search_provider || 'duckduckgo'}
              onChange={(e) => onChange('search_provider', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer', fontFamily: 'var(--font-sans)' }}
              onFocus={handleFocus}
              onBlur={handleBlur}
            >
              <option value="duckduckgo">DuckDuckGo (Fast, Local Scraped)</option>
              <option value="searxng">SearXNG (Private, Multi-Engine Metasearch)</option>
              <option value="both">Both (Parallel Search & Merge)</option>
            </select>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#d4d4d8' }}>
                SearXNG Instance URL
              </label>
              <span style={{ fontSize: '0.72rem', color: '#71717a' }}>
                Metasearch container endpoint
              </span>
            </div>
            <input
              type="text"
              value={settings.searxng_url || ''}
              onChange={(e) => onChange('searxng_url', e.target.value)}
              placeholder="http://localhost:8080"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#d4d4d8' }}>
                Max Scraped Pages per Query
              </label>
              <span style={{ fontSize: '0.72rem', color: '#71717a' }}>
                Range: 1 - 25 sources
              </span>
            </div>
            <input
              type="number"
              value={settings.max_sources || 5}
              onChange={(e) => onChange('max_sources', parseInt(e.target.value, 10) || 5)}
              min="1"
              max="25"
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
