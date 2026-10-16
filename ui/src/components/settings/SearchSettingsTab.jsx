import React from 'react';
import { Search } from 'lucide-react';

export default function SearchSettingsTab({ settings, onChange }) {
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
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#f4f4f5'
          }}
        >
          <Search size={16} color="#818cf8" />
          <span>Search Engine & Provider Routing</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
              Engine Choice
            </label>
            <select
              value={settings.search_provider || 'duckduckgo'}
              onChange={(e) => onChange('search_provider', e.target.value)}
              style={inputStyle}
            >
              <option value="duckduckgo">DuckDuckGo (Fast, Local Scraped)</option>
              <option value="searxng">SearXNG (Private, Multi-Engine Metasearch)</option>
              <option value="both">Both (Parallel Search & Merge)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
              SearXNG Instance URL
            </label>
            <input
              type="text"
              value={settings.searxng_url || ''}
              onChange={(e) => onChange('searxng_url', e.target.value)}
              placeholder="http://localhost:8080"
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
              Base endpoint for the local or remote SearXNG container.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
              Max Scraped Pages per Query
            </label>
            <input
              type="number"
              value={settings.max_sources || 5}
              onChange={(e) => onChange('max_sources', parseInt(e.target.value, 10) || 5)}
              min="1"
              max="25"
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
      </div>
    </div>
  );
}
