import React from 'react';
import { PlayCircle, Globe } from 'lucide-react';
import ToggleSwitch from '../ui/ToggleSwitch';

export default function MediaSettingsTab({ settings, onChange }) {
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
      {/* Searqon Scraper & Crawler */}
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
            <Globe size={16} color="#818cf8" />
            <span>Searqon Web Scraper & Crawler</span>
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#71717a', margin: 0 }}>
            Parallel web scraping daemon that extracts structured markdown from target URLs.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#d4d4d8' }}>
                Searqon Batch Scrape URL
              </label>
              <span style={{ fontSize: '0.72rem', color: '#71717a' }}>
                Go microservice endpoint
              </span>
            </div>
            <input
              type="text"
              value={settings.searqon_url || ''}
              onChange={(e) => onChange('searqon_url', e.target.value)}
              placeholder="http://127.0.0.1:4001/scrape/batch"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '16px',
              borderTop: '1px solid #27272a',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.84rem', color: '#f4f4f5' }}>
                Recursive Domain Crawling
              </div>
              <div style={{ fontSize: '0.74rem', color: '#71717a', marginTop: '2px' }}>
                Discover and ingest linked pages under discovered domains automatically.
              </div>
            </div>
            <ToggleSwitch
              checked={!!settings.deep_crawl_enabled}
              onChange={(val) => onChange('deep_crawl_enabled', val)}
            />
          </div>
        </div>
      </div>

      {/* YouTube Integration */}
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
            <PlayCircle size={16} color="#ef4444" />
            <span>YouTube Transcript Microservice</span>
          </h3>
          <p style={{ fontSize: '0.78rem', color: '#71717a', margin: 0 }}>
            Extract spoken audio transcripts from YouTube URLs added as notebook sources.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.78rem', fontWeight: 500, color: '#d4d4d8' }}>
                YouTube Microservice URL
              </label>
              <span style={{ fontSize: '0.72rem', color: '#71717a' }}>
                Local transcript proxy daemon
              </span>
            </div>
            <input
              type="text"
              value={settings.youtube_service_url || ''}
              onChange={(e) => onChange('youtube_service_url', e.target.value)}
              placeholder="http://127.0.0.1:6001"
              style={inputStyle}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '16px',
              borderTop: '1px solid #27272a',
              gap: '16px'
            }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.84rem', color: '#f4f4f5' }}>
                Auto-Fetch Video Transcripts
              </div>
              <div style={{ fontSize: '0.74rem', color: '#71717a', marginTop: '2px' }}>
                Extract and index spoken transcripts when YouTube videos appear in search results.
              </div>
            </div>
            <ToggleSwitch
              checked={!!settings.youtube_enabled}
              onChange={(val) => onChange('youtube_enabled', val)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
