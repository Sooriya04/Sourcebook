import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettingsConfig } from '../hooks/useSettingsConfig';
import LLMSettingsTab from '../components/settings/LLMSettingsTab';
import SearchSettingsTab from '../components/settings/SearchSettingsTab';
import MediaSettingsTab from '../components/settings/MediaSettingsTab';
import EmbeddingSettingsTab from '../components/settings/EmbeddingSettingsTab';
import Toast from '../components/ui/Toast';
import Spinner from '../components/ui/Spinner';

const SETTINGS_CATEGORIES = [
  { id: 'llm', label: 'AI & Models' },
  { id: 'search', label: 'Search Engine' },
  { id: 'media', label: 'Crawling & Media' },
  { id: 'embedding', label: 'Vector & Embeddings' }
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
    isDirty,
    toast,
    setToast,
    testingKey,
    testStatus,
    testStatuses,
    handleTestConnection,
    handleSave
  } = useSettingsConfig();

  if (loading) {
    return (
      <div className="settings-loading-state">
        <Spinner size={18} color="var(--accent)" />
        <span>Loading settings...</span>
      </div>
    );
  }

  return (
    <div className="settings-page-container">
      <div className="settings-page-inner">
        {/* Clean Aligned Header: Settings + Back to Workspace */}
        <header className="settings-intro">
          <h1 className="settings-main-title">Settings</h1>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="settings-back-btn-top"
          >
            <ArrowLeft size={14} />
            <span>Back to Workspace</span>
          </button>
        </header>

        {/* Minimal Horizontal Category Navigation */}
        <nav className="settings-tabs-bar" role="tablist" aria-label="Settings categories">
          {SETTINGS_CATEGORIES.map((cat) => {
            const isActive = activeTab === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={`settings-tab-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveTab(cat.id)}
              >
                <span>{cat.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Two-Column Main Workspace */}
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
              testStatuses={testStatuses}
              onTestConnection={handleTestConnection}
              onSave={handleSave}
              saving={saving}
              isDirty={isDirty}
            />
          )}

          {activeTab === 'search' && (
            <SearchSettingsTab
              settings={settings}
              onChange={handleChange}
              onSave={handleSave}
              saving={saving}
              isDirty={isDirty}
            />
          )}

          {activeTab === 'media' && (
            <MediaSettingsTab
              settings={settings}
              onChange={handleChange}
              onSave={handleSave}
              saving={saving}
              isDirty={isDirty}
            />
          )}

          {activeTab === 'embedding' && (
            <EmbeddingSettingsTab
              settings={settings}
              onChange={handleChange}
              onSave={handleSave}
              saving={saving}
              isDirty={isDirty}
            />
          )}
        </div>
      </div>

      {toast.message && (
        <div style={{ position: 'fixed', bottom: '20px', left: '20px', zIndex: 1200 }}>
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
