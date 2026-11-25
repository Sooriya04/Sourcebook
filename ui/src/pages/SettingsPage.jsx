import React from 'react';
import { ArrowLeft, Cpu, Search, Globe, Layers, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettingsConfig } from '../hooks/useSettingsConfig';
import LLMSettingsTab from '../components/settings/LLMSettingsTab';
import SearchSettingsTab from '../components/settings/SearchSettingsTab';
import MediaSettingsTab from '../components/settings/MediaSettingsTab';
import EmbeddingSettingsTab from '../components/settings/EmbeddingSettingsTab';
import Toast from '../components/ui/Toast';
import Spinner from '../components/ui/Spinner';

const SETTINGS_CATEGORIES = [
  { id: 'llm', label: 'AI & Models', icon: <Cpu size={14} /> },
  { id: 'search', label: 'Search Engine', icon: <Search size={14} /> },
  { id: 'media', label: 'Crawling & Media', icon: <Globe size={14} /> },
  { id: 'embedding', label: 'Vector & Embeddings', icon: <Layers size={14} /> }
];

export default function SettingsPage() {
  const navigate = useNavigate();

  const {
    activeTab,
    setActiveTab,
    settings,
    handleChange,
    provider,
    savedProvider,
    setProvider,
    providerConfigs,
    handleConfigChange,
    loading,
    saving,
    saveMessage,
    toast,
    setToast,
    testingKey,
    testStatus,
    handleTestConnection,
    handleSave
  } = useSettingsConfig();

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          height: '100%',
          width: '100%',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0e0f12',
          color: '#8e918f',
          gap: '12px'
        }}
      >
        <Spinner size={18} color="#a8c7fa" />
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.85rem' }}>
          LOADING SETTINGS...
        </p>
      </div>
    );
  }

  const isError = saveMessage && (saveMessage.includes('Error') || saveMessage.includes('fail'));

  return (
    <div className="settings-page-container">
      <div className="settings-page-inner">
        {/* Top Header: Branding, Back Link, and Page Title */}
        <header className="settings-top-header">
          <div className="settings-title-cluster">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="settings-back-link"
              title="Return to notebooks"
            >
              <ArrowLeft size={13} />
              <span>Back to Notebooks</span>
            </button>

            <h1 className="settings-main-title">Settings</h1>
            <p className="settings-main-desc">
              Manage your research infrastructure, providers, and integrations.
            </p>
          </div>

          {saveMessage && (
            <div className={`settings-status-banner ${isError ? 'error' : 'success'}`}>
              {isError ? <AlertCircle size={14} /> : <CheckCircle2 size={14} />}
              <span>{saveMessage}</span>
            </div>
          )}
        </header>

        {/* Compact Horizontal Category Navigation */}
        <nav className="settings-category-nav" role="tablist" aria-label="Settings categories">
          {SETTINGS_CATEGORIES.map((cat) => {
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`settings-category-tab ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(cat.id)}
              >
                <span className="tab-icon">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Two-Panel Integration Workspace */}
        <div className="settings-workspace-stage">
          {activeTab === 'llm' && (
            <LLMSettingsTab
              provider={provider}
              savedProvider={savedProvider}
              setProvider={setProvider}
              providerConfigs={providerConfigs}
              onChangeConfig={handleConfigChange}
              testingKey={testingKey}
              testStatus={testStatus}
              onTestConnection={handleTestConnection}
              onSave={handleSave}
              saving={saving}
            />
          )}

          {activeTab === 'search' && (
            <SearchSettingsTab
              settings={settings}
              onChange={handleChange}
              onSave={handleSave}
              saving={saving}
            />
          )}

          {activeTab === 'media' && (
            <MediaSettingsTab
              settings={settings}
              onChange={handleChange}
              onSave={handleSave}
              saving={saving}
            />
          )}

          {activeTab === 'embedding' && (
            <EmbeddingSettingsTab
              settings={settings}
              onChange={handleChange}
              onSave={handleSave}
              saving={saving}
            />
          )}
        </div>
      </div>

      {/* Floating feedback toast */}
      {toast.message && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1200 }}>
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast({ message: '', type: 'info' })}
          />
        </div>
      )}
    </div>
  );
}
