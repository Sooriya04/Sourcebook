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

  const isError = saveMessage && (saveMessage.includes('Error') || saveMessage.includes('fail'));

  return (
    <div className="settings-header">
      <div className="settings-header-info">
        <h1 className="settings-header-title">
          {titles[activeTab] || 'Settings'}
        </h1>
        <p className="settings-header-desc">
          {descriptions[activeTab] || 'Configure persistent workspace properties.'}
        </p>
      </div>

      <div className="settings-header-actions">
        {saveMessage && (
          <div className={`settings-status-banner ${isError ? 'error' : 'success'}`}>
            {isError ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
            <span>{saveMessage}</span>
          </div>
        )}

        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="settings-save-btn"
        >
          {saving ? <Spinner size={14} color="var(--text-primary)" /> : <Save size={14} />}
          <span>{saving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>
    </div>
  );
}
