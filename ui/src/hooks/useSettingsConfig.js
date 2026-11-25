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
    searxng_split: 3,
    ddg_split: 2,
    searqon_url: 'http://127.0.0.1:4001/scrape/batch',
    youtube_enabled: false,
    youtube_service_url: 'http://127.0.0.1:6001',
    youtube_max_sources: 3,
    deep_crawl_enabled: false,
    deep_crawl_limit: 5,
    deep_crawl_depth: 1,
    embedding_provider: 'local',
    embedding_url: '',
    embedding_model: 'nomic-embed-text'
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [isDirty, setIsDirty] = useState(false);

  const [provider, setProvider] = useState(() => {
    try {
      const saved = localStorage.getItem('sourcebook_active_provider');
      if (saved) return saved;
    } catch { /* ignore */ }
    return 'ollama';
  });

  const [savedProvider, setSavedProvider] = useState(() => {
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
  const [testStatuses, setTestStatuses] = useState({});

  const handleSelectProvider = (newProvider) => {
    setProvider(newProvider);
    if (newProvider !== savedProvider) {
      setIsDirty(true);
    }
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

      try {
        const modelsData = await fetchModels();
        if (modelsData && modelsData.provider) {
          if (!activeProvider) {
            activeProvider = modelsData.provider;
          }
          configs[modelsData.provider] = {
            ...configs[modelsData.provider],
            baseUrl: modelsData.base_url || configs[modelsData.provider]?.baseUrl,
            model: modelsData.active || configs[modelsData.provider]?.model,
            apiKey: modelsData.api_key !== undefined ? modelsData.api_key : configs[modelsData.provider]?.apiKey,
          };
        }
      } catch (e) {
        console.warn('fetchModels warning:', e);
      }

      if (!activeProvider) {
        try {
          activeProvider = localStorage.getItem('sourcebook_active_provider');
        } catch { /* ignore */ }
      }
      if (!activeProvider) {
        activeProvider = 'ollama';
      }

      setProvider(activeProvider);
      setSavedProvider(activeProvider);
      setIsDirty(false);
      try {
        localStorage.setItem('sourcebook_active_provider', activeProvider);
        localStorage.setItem('sourcebook_provider_configs', JSON.stringify(configs));
      } catch { /* ignore */ }
      setProviderConfigs(configs);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigChange = (pId, field, value) => {
    setIsDirty(true);
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
    setIsDirty(true);
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const getCurrentConfig = () => providerConfigs[provider] || DEFAULT_PROVIDER_CONFIGS[provider] || DEFAULT_PROVIDER_CONFIGS.ollama || DEFAULT_PROVIDER_CONFIGS.openai;

  const handleTestConnection = async () => {
    setTestingKey(true);
    const targetProvider = provider;
    const cfg = getCurrentConfig();
    setTestStatuses((prev) => ({ ...prev, [targetProvider]: { status: 'connecting' } }));
    try {
      const result = await testModelConfig({
        provider: targetProvider,
        baseUrl: cfg.baseUrl,
        model: cfg.model,
        apiKey: cfg.apiKey
      });
      const successMsg = result.message || 'Connected successfully!';
      setTestStatuses((prev) => ({
        ...prev,
        [targetProvider]: { status: 'connected', valid: true, message: successMsg }
      }));
      setToast({ message: successMsg, type: 'success' });
    } catch (err) {
      setTestStatuses((prev) => ({
        ...prev,
        [targetProvider]: { status: 'error', valid: false, error: err.message }
      }));
      setToast({ message: `Connection test failed: ${err.message}`, type: 'error' });
    } finally {
      setTestingKey(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    const cfg = getCurrentConfig();
    try {
      const updatedConfigs = {
        ...providerConfigs,
        [provider]: {
          ...(providerConfigs[provider] || DEFAULT_PROVIDER_CONFIGS[provider] || {}),
          baseUrl: cfg.baseUrl,
          model: cfg.model,
          apiKey: cfg.apiKey,
          orgId: cfg.orgId || ''
        }
      };

      const payload = {
        ...settings,
        llm_provider: provider,
        llm_base_url: cfg.baseUrl,
        llm_model: cfg.model,
        llm_api_key: cfg.apiKey,
        provider_configs: JSON.stringify(updatedConfigs)
      };

      await updateSettings(payload);
      await updateModelConfig({
        provider,
        baseUrl: cfg.baseUrl,
        model: cfg.model,
        apiKey: cfg.apiKey
      });

      setSavedProvider(provider);
      setProviderConfigs(updatedConfigs);
      setIsDirty(false);
      try {
        localStorage.setItem('sourcebook_active_provider', provider);
        localStorage.setItem('sourcebook_provider_configs', JSON.stringify(updatedConfigs));
      } catch { /* ignore */ }

      setSaveMessage('Settings saved');
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
    provider, savedProvider, setProvider: handleSelectProvider, providerConfigs, handleConfigChange,
    loading, saving, saveMessage, isDirty, toast, setToast,
    testingKey, testStatus: testStatuses[provider] || null, testStatuses, handleTestConnection, handleSave
  };
}
