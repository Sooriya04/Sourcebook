import React, { useState, useEffect } from 'react';
import { Save, Search, Cpu, Globe, ArrowLeft, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { 
  fetchSettings, 
  updateSettings, 
  fetchModels, 
  testModelConfig, 
  updateModelConfig 
} from '../services/sourcebookApi';
import LLMSettingsTab from '../components/settings/LLMSettingsTab';
import SearchSettingsTab from '../components/settings/SearchSettingsTab';
import MediaSettingsTab from '../components/settings/MediaSettingsTab';
import EmbeddingSettingsTab from '../components/settings/EmbeddingSettingsTab';

export default function SettingsPage() {
  const navigate = useNavigate();
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
  const [baseUrl, setBaseUrl] = useState('http://localhost:20128/v1');
  const [activeModel, setActiveModel] = useState('ag/gemini-3.6-flash-low');
  const [apiKey, setApiKey] = useState('');
  const [testingKey, setTestingKey] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchSettings();
      if (data) {
        setSettings(prev => ({ ...prev, ...data }));
        if (data.llm_provider) setProvider(data.llm_provider);
        if (data.llm_base_url) setBaseUrl(data.llm_base_url);
        if (data.llm_model) setActiveModel(data.llm_model);
        if (data.llm_api_key) setApiKey(data.llm_api_key);
      }
      const modelsData = await fetchModels();
      if (modelsData) {
        if (modelsData.active) setActiveModel(modelsData.active);
        if (modelsData.provider) setProvider(modelsData.provider);
        if (modelsData.base_url) setBaseUrl(modelsData.base_url);
        if (modelsData.api_key) setApiKey(modelsData.api_key);
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleTestConnection = async () => {
    setTestingKey(true);
    setTestStatus(null);
    try {
      const result = await testModelConfig({ provider, baseUrl, model: activeModel, apiKey });
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
    try {
      const payload = { ...settings, llm_provider: provider, llm_base_url: baseUrl, llm_model: activeModel, llm_api_key: apiKey };
      await updateSettings(payload);
      await updateModelConfig({ provider, baseUrl, model: activeModel, apiKey });
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

  const tabs = [
    { id: 'llm', label: 'AI & Model Provider', icon: <Cpu size={18} /> },
    { id: 'search', label: 'Web Search Engine', icon: <Search size={18} /> },
    { id: 'media', label: 'Crawling & Media', icon: <Globe size={18} /> },
    { id: 'embedding', label: 'Vector & Embeddings', icon: <Layers size={18} /> }
  ];

  return (
    <div style={{ display: 'flex', width: '100%', flex: 1, height: '100%', background: 'var(--canvas)', color: 'var(--text-main)', fontFamily: 'Sora, sans-serif' }}>
      <aside style={{ width: '240px', borderRight: '1px solid var(--border-color)', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--panel)' }}>
        <button 
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '16px', borderRadius: '6px' }}
        >
          <ArrowLeft size={16} /> Back to Notebooks
        </button>

        <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', paddingLeft: '12px', marginBottom: '8px' }}>Settings</h2>

        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', fontWeight: 500,
              background: activeTab === tab.id ? 'var(--bg-hover)' : 'transparent',
              color: activeTab === tab.id ? 'var(--text-main)' : 'var(--text-dim)'
            }}
          >
            {React.cloneElement(tab.icon, { color: activeTab === tab.id ? 'var(--accent-primary)' : 'currentColor' })}
            {tab.label}
          </button>
        ))}
      </aside>

      <main style={{ flex: 1, padding: '36px 48px', overflowY: 'auto', width: '100%' }}>
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
              onClick={handleSave}
              disabled={saving}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'var(--accent-primary)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', fontSize: '0.82rem', whitespace: 'nowrap' }}
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </div>

        {activeTab === 'llm' && (
          <LLMSettingsTab
            provider={provider} setProvider={setProvider}
            baseUrl={baseUrl} setBaseUrl={setBaseUrl}
            activeModel={activeModel} setActiveModel={setActiveModel}
            apiKey={apiKey} setApiKey={setApiKey}
            testingKey={testingKey} testStatus={testStatus}
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
