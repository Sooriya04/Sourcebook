import React from 'react';
import { PlayCircle, Globe } from 'lucide-react';

export default function MediaSettingsTab({ settings, onChange }) {
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
      {/* Searqon Scraper & Crawler */}
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
          <Globe size={16} color="#818cf8" />
          <span>Searqon Web Scraper & Crawler</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
              Searqon Batch Scrape URL
            </label>
            <input
              type="text"
              value={settings.searqon_url || ''}
              onChange={(e) => onChange('searqon_url', e.target.value)}
              placeholder="http://127.0.0.1:4001/scrape/batch"
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

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid #27272a'
            }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.84rem', color: '#f4f4f5' }}>Recursive Domain Crawling</div>
              <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                Discover and ingest linked pages under discovered domains automatically.
              </div>
            </div>
            <input
              type="checkbox"
              checked={!!settings.deep_crawl_enabled}
              onChange={(e) => onChange('deep_crawl_enabled', e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#6366f1' }}
            />
          </div>
        </div>
      </div>

      {/* YouTube Integration */}
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
          <PlayCircle size={16} color="#ef4444" />
          <span>YouTube Transcript Microservice</span>
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, marginBottom: '6px', color: '#a1a1aa' }}>
              YouTube Microservice URL
            </label>
            <input
              type="text"
              value={settings.youtube_service_url || ''}
              onChange={(e) => onChange('youtube_service_url', e.target.value)}
              placeholder="http://127.0.0.1:6001"
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

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '1px solid #27272a'
            }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.84rem', color: '#f4f4f5' }}>Auto-Fetch Video Transcripts</div>
              <div style={{ fontSize: '0.72rem', color: '#71717a', marginTop: '2px' }}>
                Extract and index spoken transcripts when YouTube videos appear in search results.
              </div>
            </div>
            <input
              type="checkbox"
              checked={!!settings.youtube_enabled}
              onChange={(e) => onChange('youtube_enabled', e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#6366f1' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
