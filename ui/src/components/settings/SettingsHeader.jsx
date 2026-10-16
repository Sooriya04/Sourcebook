import React from 'react';
import { Save, CheckCircle2, AlertCircle } from 'lucide-react';

export default function SettingsHeader({ activeTab, saveMessage, saving, onSave }) {
  const titles = {
    llm: 'AI Model & Key Configuration',
    search: 'Search Discovery Engine',
    media: 'Crawling & Media Integration',
    embedding: 'Vector Embeddings & Search Index'
  };

  const descriptions = {
    llm: 'Configure endpoints, provider credentials, and model architecture parameters.',
    search: 'Configure SearXNG and DuckDuckGo metasearch discovery engines.',
    media: 'Configure Searqon batch scraper and YouTube transcript microservices.',
    embedding: 'Configure sentence embeddings for semantic reranking and vector retrieval.'
  };

  const isError = saveMessage && saveMessage.includes('Error');

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '28px',
        paddingBottom: '18px',
        borderBottom: '1px solid #27272a',
        flexWrap: 'wrap',
        gap: '16px'
      }}
    >
      <div>
        <h1
          style={{
            fontSize: '1.25rem',
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: '#f4f4f5',
            margin: '0 0 4px 0'
          }}
        >
          {titles[activeTab] || 'Settings'}
        </h1>
        <p style={{ fontSize: '0.8rem', color: '#71717a', margin: 0 }}>
          {descriptions[activeTab] || 'Configure persistent workspace properties.'}
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {saveMessage && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.76rem',
              padding: '4px 10px',
              borderRadius: '6px',
              backgroundColor: isError ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              border: isError ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
              color: isError ? '#fca5a5' : '#6ee7b7',
              fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
              fontWeight: 500
            }}
          >
            {isError ? <AlertCircle size={13} /> : <CheckCircle2 size={13} />}
            <span>{saveMessage}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 18px',
            backgroundColor: '#4f46e5', // restrained indigo
            color: '#ffffff',
            border: '1px solid #6366f1',
            borderRadius: '8px',
            fontWeight: 600,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '0.82rem',
            transition: 'all 0.15s ease',
            opacity: saving ? 0.7 : 1
          }}
          onMouseEnter={(e) => {
            if (!saving) e.currentTarget.style.backgroundColor = '#4338ca';
          }}
          onMouseLeave={(e) => {
            if (!saving) e.currentTarget.style.backgroundColor = '#4f46e5';
          }}
        >
          <Save size={14} />
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  );
}
