import React from 'react';
import { PlayCircle, Globe } from 'lucide-react';

export default function MediaSettingsTab({ settings, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Searqon Scraper & Crawler */}
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Globe size={18} color="var(--accent-primary)" /> Searqon Web Scraper & Crawler
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-dim)' }}>
              Searqon Batch Scrape URL
            </label>
            <input
              type="text"
              value={settings.searqon_url || ''}
              onChange={(e) => onChange('searqon_url', e.target.value)}
              placeholder="http://127.0.0.1:4001/scrape/batch"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>Recursive Domain Crawling</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Discover and ingest linked pages under discovered domains automatically.
              </div>
            </div>
            <input
              type="checkbox"
              checked={!!settings.deep_crawl_enabled}
              onChange={(e) => onChange('deep_crawl_enabled', e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
            />
          </div>
        </div>
      </div>

      {/* YouTube Integration */}
      <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <PlayCircle size={18} color="#ef4444" /> YouTube Transcript Microservice
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px', color: 'var(--text-dim)' }}>
              YouTube Microservice URL
            </label>
            <input
              type="text"
              value={settings.youtube_service_url || ''}
              onChange={(e) => onChange('youtube_service_url', e.target.value)}
              placeholder="http://127.0.0.1:6001"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-color)' }}>
            <div>
              <div style={{ fontWeight: 500, fontSize: '0.88rem' }}>Auto-Fetch Video Transcripts</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                Extract and index spoken transcripts when YouTube videos appear in search results.
              </div>
            </div>
            <input
              type="checkbox"
              checked={!!settings.youtube_enabled}
              onChange={(e) => onChange('youtube_enabled', e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--accent-primary)' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
