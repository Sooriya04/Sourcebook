import React from 'react';
import { Cpu, Search, Globe, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
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
        {/* Settings Introduction */}
        <header className="settings-intro">
          <nav className="settings-breadcrumb" aria-label="Breadcrumb">
            <Link to="/" className="settings-breadcrumb-link">
              Workspace
            </Link>
            <span className="settings-breadcrumb-sep">/</span>
            <span className="settings-breadcrumb-current">Settings</span>
          </nav>

          <h1 className="settings-main-title">Settings</h1>
          <p className="settings-main-desc">
            Manage your research infrastructure, providers, and integrations.
          </p>
        </header>

        {/* Refined Horizontal Category Navigation */}
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
                <span className="settings-tab-icon">{cat.icon}</span>
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
