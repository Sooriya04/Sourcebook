import React from 'react';
import { useSettingsConfig } from '../hooks/useSettingsConfig';
import SettingsSidebar from '../components/settings/SettingsSidebar';
import SettingsHeader from '../components/settings/SettingsHeader';
import LLMSettingsTab from '../components/settings/LLMSettingsTab';
import SearchSettingsTab from '../components/settings/SearchSettingsTab';
import MediaSettingsTab from '../components/settings/MediaSettingsTab';
import EmbeddingSettingsTab from '../components/settings/EmbeddingSettingsTab';
import Toast from '../components/ui/Toast';
import Spinner from '../components/ui/Spinner';

export default function SettingsPage() {
  const {
    activeTab,
    setActiveTab,
    settings,
    handleChange,
    provider,
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

  return (
    <div className="settings-container">
      <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="settings-main-scroll">
        <div className="settings-content-wrapper">
          <SettingsHeader
            activeTab={activeTab}
            saveMessage={saveMessage}
            saving={saving}
            onSave={handleSave}
          />

          {activeTab === 'llm' && (
            <LLMSettingsTab
              provider={provider}
              setProvider={setProvider}
              providerConfigs={providerConfigs}
              onChangeConfig={handleConfigChange}
              testingKey={testingKey}
              testStatus={testStatus}
              onTestConnection={handleTestConnection}
            />
          )}
          {activeTab === 'search' && <SearchSettingsTab settings={settings} onChange={handleChange} />}
          {activeTab === 'media' && <MediaSettingsTab settings={settings} onChange={handleChange} />}
          {activeTab === 'embedding' && <EmbeddingSettingsTab settings={settings} onChange={handleChange} />}
        </div>
      </main>

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
