import React from 'react';
import { Save, CheckCircle2, AlertCircle } from 'lucide-react';
import Spinner from '../ui/Spinner';

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
        paddingBottom: '20px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
        flexWrap: 'wrap',
        gap: '16px'
      }}
    >
      <div>
        <h1
          style={{
            fontSize: '1.35rem',
            fontWeight: 500,
            letterSpacing: '-0.02em',
            color: '#e3e3e3',
            margin: '0 0 4px 0'
          }}
        >
          {titles[activeTab] || 'Settings'}
        </h1>
        <p style={{ fontSize: '0.82rem', color: '#8e918f', margin: 0 }}>
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
              fontSize: '0.78rem',
              padding: '6px 12px',
              borderRadius: '6px',
              backgroundColor: isError ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
              border: isError ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
              color: isError ? '#fca5a5' : '#6ee7b7',
              fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
              fontWeight: 500
            }}
          >
            {isError ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
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
            gap: '7px',
            padding: '8px 18px',
            backgroundColor: '#131314',
            color: '#e3e3e3',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '9999px',
            fontWeight: 500,
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '0.84rem',
            transition: 'all 0.15s ease',
            opacity: saving ? 0.7 : 1
          }}
          onMouseEnter={(e) => {
            if (!saving) {
              e.currentTarget.style.backgroundColor = '#282a2d';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.color = '#ffffff';
            }
          }}
          onMouseLeave={(e) => {
            if (!saving) {
              e.currentTarget.style.backgroundColor = '#131314';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
              e.currentTarget.style.color = '#e3e3e3';
            }
          }}
        >
          {saving ? <Spinner size={14} color="#e3e3e3" /> : <Save size={14} />}
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  );
}
