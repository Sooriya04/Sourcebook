import React from 'react';
import { Search, Globe } from 'lucide-react';

export default function SearchSettingsTab({ settings, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Search size={18} color="var(--accent-primary)" /> Search Engine & Provider Routing
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-dim)' }}>
              Engine Choice
            </label>
            <select
              value={settings.search_provider || 'duckduckgo'}
              onChange={(e) => onChange('search_provider', e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
            >
              <option value="duckduckgo">DuckDuckGo (Fast, Local Scraped)</option>
              <option value="searxng">SearXNG (Private, Multi-Engine Metasearch)</option>
              <option value="both">Both (Parallel Search & Merge)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-dim)' }}>
              SearXNG Instance URL
            </label>
            <input
              type="text"
              value={settings.searxng_url || ''}
              onChange={(e) => onChange('searxng_url', e.target.value)}
              placeholder="http://localhost:8080"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
            />
            <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)', display: 'block', marginTop: '4px' }}>
              Base endpoint for the local or remote SearXNG container.
            </span>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-dim)' }}>
              Max Scraped Pages per Query
            </label>
            <input
              type="number"
              value={settings.max_sources || 5}
              onChange={(e) => onChange('max_sources', parseInt(e.target.value) || 5)}
              min="1"
              max="25"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
