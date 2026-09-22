import React, { useState, useEffect } from 'react';
import { 
  fetchSettings, 
  updateSettings, 
  fetchModels, 
  testModelConfig, 
  updateModelConfig 
} from '../services/sourcebookApi';
import SettingsSidebar from '../components/settings/SettingsSidebar';
import SettingsHeader from '../components/settings/SettingsHeader';
import LLMSettingsTab, { DEFAULT_PROVIDER_CONFIGS } from '../components/settings/LLMSettingsTab';
import SearchSettingsTab from '../components/settings/SearchSettingsTab';
import MediaSettingsTab from '../components/settings/MediaSettingsTab';
import EmbeddingSettingsTab from '../components/settings/EmbeddingSettingsTab';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('llm');
  const [settings, setSettings] = useState({
    search_provider: 'duckduckgo', searxng_url: 'http://localhost:8080', max_sources: 5,
    searqon_url: 'http://127.0.0.1:4001/scrape/batch', youtube_enabled: false, youtube_service_url: 'http://127.0.0.1:6001',
    deep_crawl_enabled: false, embedding_provider: 'local', embedding_url: '', embedding_model: 'nomic-embed-text'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  const [provider, setProvider] = useState('openai');
  const [providerConfigs, setProviderConfigs] = useState(() => {
    try {
      const saved = localStorage.getItem('sourcebook_provider_configs');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return { ...DEFAULT_PROVIDER_CONFIGS };
  });
  const [testingKey, setTestingKey] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchSettings();
      let configs = { ...DEFAULT_PROVIDER_CONFIGS };
      try {
        const local = localStorage.getItem('sourcebook_provider_configs');
        if (local) configs = { ...configs, ...JSON.parse(local) };
      } catch (_) {}

      if (data) {
        setSettings(prev => ({ ...prev, ...data }));
        if (data.provider_configs) {
          try {
            configs = { ...configs, ...JSON.parse(data.provider_configs) };
          } catch (_) {}
        }
        if (data.llm_provider) {
          setProvider(data.llm_provider);
          configs[data.llm_provider] = {
            ...configs[data.llm_provider],
            baseUrl: data.llm_base_url || configs[data.llm_provider]?.baseUrl,
            model: data.llm_model || configs[data.llm_provider]?.model,
            apiKey: data.llm_api_key !== undefined ? data.llm_api_key : configs[data.llm_provider]?.apiKey,
          };
        }
      }

      const modelsData = await fetchModels();
      if (modelsData && modelsData.provider) {
        setProvider(modelsData.provider);
        configs[modelsData.provider] = {
          ...configs[modelsData.provider],
          baseUrl: modelsData.base_url || configs[modelsData.provider]?.baseUrl,
          model: modelsData.active || configs[modelsData.provider]?.model,
          apiKey: modelsData.api_key !== undefined ? modelsData.api_key : configs[modelsData.provider]?.apiKey,
        };
      }

      setProviderConfigs(configs);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (pId, field, value) => {
    setProviderConfigs(prev => {
      const updated = {
        ...prev,
        [pId]: {
          ...(prev[pId] || DEFAULT_PROVIDER_CONFIGS[pId] || {}),
          [field]: value
        }
      };
      try {
        localStorage.setItem('sourcebook_provider_configs', JSON.stringify(updated));
      } catch (_) {}
      return updated;
    });
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleTestConnection = async () => {
    setTestingKey(true);
    setTestStatus(null);
    const cfg = providerConfigs[provider] || DEFAULT_PROVIDER_CONFIGS[provider] || DEFAULT_PROVIDER_CONFIGS.openai;
    try {
      const result = await testModelConfig({
        provider,
        baseUrl: cfg.baseUrl,
        model: cfg.model,
        apiKey: cfg.apiKey
      });
      setTestStatus({ valid: true, message: result.message || 'Connected successfully!' });
      setTimeout(() => setTestStatus(null), 4000);
    } catch (err) {
      setTestStatus({ valid: false, error: err.message });
      setTimeout(() => setTestStatus(null), 4000);
    } finally {
      setTestingKey(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    const cfg = providerConfigs[provider] || DEFAULT_PROVIDER_CONFIGS[provider] || DEFAULT_PROVIDER_CONFIGS.openai;
    try {
      const payload = {
        ...settings,
        llm_provider: provider,
        llm_base_url: cfg.baseUrl,
        llm_model: cfg.model,
        llm_api_key: cfg.apiKey,
        provider_configs: JSON.stringify(providerConfigs)
      };
      await updateSettings(payload);
      await updateModelConfig({
        provider,
        baseUrl: cfg.baseUrl,
        model: cfg.model,
        apiKey: cfg.apiKey
      });
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage(`Error saving settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--canvas)', color: 'var(--text-main)' }}>
        <p style={{ fontSize: '0.95rem', letterSpacing: '0.05em' }}>LOADING SETTINGS...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', width: '100%', flex: 1, height: '100%', background: 'var(--canvas)', color: 'var(--text-main)', fontFamily: 'Sora, sans-serif' }}>
      <SettingsSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main style={{ flex: 1, padding: '36px 48px', overflowY: 'auto', width: '100%' }}>
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
      </main>
    </div>
  );
}
