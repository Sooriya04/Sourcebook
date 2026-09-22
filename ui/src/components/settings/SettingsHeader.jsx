import React from 'react';
import { Save } from 'lucide-react';

export default function SettingsHeader({ activeTab, saveMessage, saving, onSave }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
      <div>
        <h1 style={{ fontSize: '1.35rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
          {activeTab === 'llm' && 'AI Model & Key Configuration'}
          {activeTab === 'search' && 'Search Discovery Engine'}
          {activeTab === 'media' && 'Crawling & Media Integration'}
          {activeTab === 'embedding' && 'Vector Embeddings & Search Index'}
        </h1>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '2px' }}>
          Configure endpoints, models, and API keys stored persistently in SQLite database.
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {saveMessage && (
          <div style={{ 
            fontSize: '0.8rem', padding: '4px 10px', borderRadius: '6px', 
            background: saveMessage.includes('Error') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
            border: saveMessage.includes('Error') ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(16, 185, 129, 0.2)',
            color: saveMessage.includes('Error') ? '#ef4444' : '#10b981', fontWeight: 500 
          }}>
            {saveMessage}
          </div>
        )}
        <button 
          onClick={onSave}
          disabled={saving}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--accent-primary)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem', whitespace: 'nowrap' }}
        >
          <Save size={14} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>
    </div>
  );
}
