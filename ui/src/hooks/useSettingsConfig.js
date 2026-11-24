import { useState, useEffect } from 'react';
import {
  fetchSettings,
  updateSettings,
  fetchModels,
  testModelConfig,
  updateModelConfig
} from '../services/sourcebookApi';
import { DEFAULT_PROVIDER_CONFIGS } from '../constants/providerDefaults';

export function useSettingsConfig() {
  const [activeTab, setActiveTab] = useState('llm');
  const [settings, setSettings] = useState({
    search_provider: 'duckduckgo',
    searxng_url: 'http://localhost:8080',
    max_sources: 5,
    searqon_url: 'http://127.0.0.1:4001/scrape/batch',
    youtube_enabled: false,
    youtube_service_url: 'http://127.0.0.1:6001',
    deep_crawl_enabled: false,
    embedding_provider: 'local',
    embedding_url: '',
    embedding_model: 'nomic-embed-text'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [provider, setProvider] = useState(() => {
    try {
      const saved = localStorage.getItem('sourcebook_active_provider');
      if (saved) return saved;
    } catch { /* ignore */ }
    return 'ollama';
  });
  const [providerConfigs, setProviderConfigs] = useState(() => {
    try {
      const saved = localStorage.getItem('sourcebook_provider_configs');
      if (saved) return JSON.parse(saved);
    } catch { /* ignore */ }
    return { ...DEFAULT_PROVIDER_CONFIGS };
  });
  const [testingKey, setTestingKey] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  const handleSelectProvider = (newProvider) => {
    setProvider(newProvider);
    try {
      localStorage.setItem('sourcebook_active_provider', newProvider);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchSettings();
      let configs = { ...DEFAULT_PROVIDER_CONFIGS };
      try {
        const local = localStorage.getItem('sourcebook_provider_configs');
        if (local) configs = { ...configs, ...JSON.parse(local) };
      } catch { /* ignore */ }

      let activeProvider = null;

      if (data) {
        setSettings((prev) => ({ ...prev, ...data }));
        if (data.provider_configs) {
          try {
            configs = { ...configs, ...JSON.parse(data.provider_configs) };
          } catch { /* ignore */ }
        }
        if (data.llm_provider) {
          activeProvider = data.llm_provider;
          configs[data.llm_provider] = {
            ...configs[data.llm_provider],
            baseUrl: data.llm_base_url || configs[data.llm_provider]?.baseUrl,
            model: data.llm_model || configs[data.llm_provider]?.model,
            apiKey: data.llm_api_key !== undefined ? data.llm_api_key : configs[data.llm_provider]?.apiKey,
          };
        }
      }

      // Sanitize any stale proxy ports (e.g. 20128 or 8090)
      Object.keys(DEFAULT_PROVIDER_CONFIGS).forEach((k) => {
        if (configs[k]?.baseUrl?.includes('20128') || configs[k]?.baseUrl?.includes('8090')) {
          configs[k].baseUrl = DEFAULT_PROVIDER_CONFIGS[k].baseUrl;
          if (configs[k].model?.startsWith('ag/')) {
            configs[k].model = DEFAULT_PROVIDER_CONFIGS[k].model;
          }
        }
      });

      const modelsData = await fetchModels();
      if (modelsData && modelsData.provider) {
        activeProvider = modelsData.provider;
        configs[modelsData.provider] = {
          ...configs[modelsData.provider],
          baseUrl: modelsData.base_url || configs[modelsData.provider]?.baseUrl,
          model: modelsData.active || configs[modelsData.provider]?.model,
          apiKey: modelsData.api_key !== undefined ? modelsData.api_key : configs[modelsData.provider]?.apiKey,
        };
      }

      if (activeProvider) {
        setProvider(activeProvider);
        try {
          localStorage.setItem('sourcebook_active_provider', activeProvider);
        } catch { /* ignore */ }
      }
      setProviderConfigs(configs);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (pId, field, value) => {
    setProviderConfigs((prev) => {
      const updated = {
        ...prev,
        [pId]: { ...(prev[pId] || DEFAULT_PROVIDER_CONFIGS[pId] || {}), [field]: value }
      };
      try { localStorage.setItem('sourcebook_provider_configs', JSON.stringify(updated)); } catch { /* ignore */ }
      return updated;
    });
  };

  const handleChange = (field, value) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const getCurrentConfig = () => providerConfigs[provider] || DEFAULT_PROVIDER_CONFIGS[provider] || DEFAULT_PROVIDER_CONFIGS.ollama || DEFAULT_PROVIDER_CONFIGS.openai;

  const handleTestConnection = async () => {
    setTestingKey(true);
    setTestStatus(null);
    const cfg = getCurrentConfig();
    try {
      const result = await testModelConfig({
        provider,
        baseUrl: cfg.baseUrl,
        model: cfg.model,
        apiKey: cfg.apiKey
      });
      const successMsg = result.message || 'Connected successfully!';
      setTestStatus({ valid: true, message: successMsg });
      setToast({ message: successMsg, type: 'success' });
      setTimeout(() => setTestStatus(null), 4000);
    } catch (err) {
      setTestStatus({ valid: false, error: err.message });
      setToast({ message: `Connection test failed: ${err.message}`, type: 'error' });
      setTimeout(() => setTestStatus(null), 4000);
    } finally {
      setTestingKey(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    const cfg = getCurrentConfig();
    try {
      try {
        localStorage.setItem('sourcebook_active_provider', provider);
      } catch { /* ignore */ }
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
      setToast({ message: 'Configuration saved to SQLite persistent store', type: 'success' });
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      const errMsg = `Error saving settings: ${err.message}`;
      setSaveMessage(errMsg);
      setToast({ message: errMsg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return {
    activeTab, setActiveTab, settings, handleChange,
    provider, setProvider: handleSelectProvider, providerConfigs, handleConfigChange,
    loading, saving, saveMessage, toast, setToast,
    testingKey, testStatus, handleTestConnection, handleSave
  };
}
