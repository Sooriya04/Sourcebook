import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Search, 
  Cpu, 
  Settings, 
  PlayCircle, 
  Globe, 
  Key, 
  CheckCircle2, 
  XCircle, 
  ArrowLeft,
  Sliders,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { 
  fetchSettings, 
  updateSettings, 
  fetchModels, 
  testModelConfig, 
  updateModelConfig 
} from '../services/sourcebookApi';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('llm'); // 'llm' | 'search' | 'integrations'
  
  const [settings, setSettings] = useState({
    search_provider: 'duckduckgo',
    max_sources: 5,
    searxng_split: 3,
    ddg_split: 2,
    youtube_enabled: false,
    youtube_max_sources: 3,
    deep_crawl_enabled: false,
    deep_crawl_limit: 5,
    deep_crawl_depth: 1,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  
  // LLM Config State
  const [provider, setProvider] = useState('openai');
  const [baseUrl, setBaseUrl] = useState('http://localhost:20128/v1');
  const [activeModel, setActiveModel] = useState('ag/gemini-3.6-flash-low');
  const [apiKey, setApiKey] = useState('');
  const [testingKey, setTestingKey] = useState(false);
  const [testStatus, setTestStatus] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchSettings();
      setSettings(data);
      
      const modelsData = await fetchModels();
      if (modelsData.active) setActiveModel(modelsData.active);
      if (modelsData.provider) setProvider(modelsData.provider);
      if (modelsData.base_url) setBaseUrl(modelsData.base_url);
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
    } catch (err) {
      setTestStatus({ valid: false, error: err.message });
    } finally {
      setTestingKey(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      await updateSettings(settings);
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

  return (
    <div style={{ display: 'flex', width: '100%', flex: 1, height: '100%', background: 'var(--canvas)', color: 'var(--text-main)', fontFamily: 'Sora, sans-serif' }}>
      
      {/* Sidebar Navigation - Clean Minimalist NotebookLM Style */}
      <aside style={{ width: '240px', borderRight: '1px solid var(--border-color)', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--panel)' }}>
        <button 
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: 'transparent', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.85rem', marginBottom: '16px', borderRadius: '6px' }}
        >
          <ArrowLeft size={16} /> Back to Notebooks
        </button>

        <h2 style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', paddingLeft: '12px', marginBottom: '8px' }}>Settings</h2>

        <button 
          onClick={() => setActiveTab('llm')}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', fontWeight: 500,
            background: activeTab === 'llm' ? 'var(--bg-hover)' : 'transparent',
            color: activeTab === 'llm' ? 'var(--text-main)' : 'var(--text-dim)'
          }}
        >
          <Cpu size={18} color={activeTab === 'llm' ? 'var(--accent-primary)' : 'currentColor'} />
          AI & Model Provider
        </button>

        <button 
          onClick={() => setActiveTab('search')}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', fontWeight: 500,
            background: activeTab === 'search' ? 'var(--bg-hover)' : 'transparent',
            color: activeTab === 'search' ? 'var(--text-main)' : 'var(--text-dim)'
          }}
        >
          <Search size={18} color={activeTab === 'search' ? 'var(--accent-primary)' : 'currentColor'} />
          Web Search Engine
        </button>

        <button 
          onClick={() => setActiveTab('integrations')}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', fontWeight: 500,
            background: activeTab === 'integrations' ? 'var(--bg-hover)' : 'transparent',
            color: activeTab === 'integrations' ? 'var(--text-main)' : 'var(--text-dim)'
          }}
        >
          <Globe size={18} color={activeTab === 'integrations' ? 'var(--accent-primary)' : 'currentColor'} />
          Crawling & YouTube
        </button>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: '36px 48px', overflowY: 'auto', width: '100%' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 600, letterSpacing: '-0.02em' }}>
              {activeTab === 'llm' && 'AI Model & Key Configuration'}
              {activeTab === 'search' && 'Search Discovery Engine'}
              {activeTab === 'integrations' && 'Crawling & Media Integration'}
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '2px' }}>
              {activeTab === 'llm' && 'Configure provider protocols, base URLs, target model names, and API keys.'}
              {activeTab === 'search' && 'Set up SearXNG and DuckDuckGo engines, maximum page limits, and parallel splits.'}
              {activeTab === 'integrations' && 'Configure Searqon domain web crawling and automated YouTube transcript fetching.'}
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

        {/* Tab 1: AI Model Configuration */}
        {activeTab === 'llm' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
            
            <div style={{ background: 'var(--bg-card)', padding: '20px 24px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={16} color="var(--accent-primary)" /> Provider Protocol
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '18px' }}>
                {[
                  { id: 'openai', label: 'OpenAI Compatible', desc: 'Custom local/cloud endpoints' },
                  { id: 'ollama', label: 'Ollama Native', desc: 'Local http://localhost:11434' },
                  { id: 'groq', label: 'Groq Cloud', desc: 'Fast LPUs (api.groq.com)' },
                  { id: 'nvidia', label: 'NVIDIA NIM', desc: 'Cloud NIM endpoints' }
                ].map(p => (
                  <div 
                    key={p.id}
                    onClick={() => {
                      setProvider(p.id);
                      if (p.id === 'ollama') setBaseUrl('http://localhost:11434');
                      else if (p.id === 'openai') setBaseUrl('http://localhost:20128/v1');
                      else if (p.id === 'groq') setBaseUrl('https://api.groq.com/openai/v1');
                      else if (p.id === 'nvidia') setBaseUrl('https://integrate.api.nvidia.com/v1');
                    }}
                    style={{
                      padding: '10px 14px', borderRadius: '6px', border: provider === p.id ? '1.5px solid var(--accent-primary)' : '1px solid var(--border-color)',
                      background: provider === p.id ? 'var(--bg-hover)' : 'transparent', cursor: 'pointer', transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: '0.85rem', marginBottom: '2px' }}>{p.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>{p.desc}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-dim)' }}>Base Endpoint URL</label>
                  <input 
                    type="text" 
                    value={baseUrl} 
                    onChange={(e) => setBaseUrl(e.target.value)}
                    placeholder="http://localhost:20128/v1"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-dim)' }}>Target Model Name</label>
                  <input 
                    type="text" 
                    value={activeModel} 
                    onChange={(e) => setActiveModel(e.target.value)}
                    placeholder="ag/gemini-3.6-flash-low"
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, marginBottom: '4px', color: 'var(--text-dim)' }}>API Key</label>
                  <input 
                    type="password" 
                    value={apiKey} 
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.85rem' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '18px', paddingTop: '14px', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                <button 
                  onClick={handleTestConnection}
                  disabled={testingKey}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'var(--bg-hover)', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '6px', cursor: 'pointer', fontWeight: 500, fontSize: '0.8rem' }}
                >
                  <ShieldCheck size={14} color="var(--accent-primary)" />
                  {testingKey ? 'Verifying Endpoint...' : 'Test Connection & Key'}
                </button>

                {testStatus && (
                  <div style={{ 
                    display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', padding: '4px 10px', borderRadius: '6px',
                    background: testStatus.valid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    border: testStatus.valid ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                    color: testStatus.valid ? '#10b981' : '#ef4444', maxWidth: '100%', wordBreak: 'break-word'
                  }}>
                    {testStatus.valid ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                    <span>{testStatus.valid ? testStatus.message : testStatus.error}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Web Search Configuration */}
        {activeTab === 'search' && (
          <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px' }}>Search Provider Routing</h3>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Engine Choice</label>
              <select 
                value={settings.search_provider} 
                onChange={(e) => handleChange('search_provider', e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
              >
                <option value="duckduckgo">DuckDuckGo (Fast, No CAPTCHAs)</option>
                <option value="searxng">SearXNG (Private, Comprehensive)</option>
                <option value="both">Both (Parallel Search)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 500, marginBottom: '6px' }}>Max Scraped Pages per Query</label>
              <input 
                type="number" 
                value={settings.max_sources} 
                onChange={(e) => handleChange('max_sources', parseInt(e.target.value) || 5)}
                min="1" max="20"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-main)', fontSize: '0.9rem' }}
              />
            </div>
          </div>
        )}

        {/* Tab 3: Crawling & Integrations */}
        {activeTab === 'integrations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PlayCircle size={18} color="#ef4444" /> YouTube Transcript Search
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>Automatically Fetch Video Transcripts</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>Search and ingest YouTube transcripts directly into notebook RAG context.</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings.youtube_enabled}
                  onChange={(e) => handleChange('youtube_enabled', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </div>

            <div style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Globe size={18} color="var(--accent-primary)" /> Searqon Recursive Sub-URL Crawler
              </h3>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>Enable Recursive Domain Crawling</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '2px' }}>Discover sub-links under target domain using Searqon service.</div>
                </div>
                <input 
                  type="checkbox" 
                  checked={!!settings.deep_crawl_enabled}
                  onChange={(e) => handleChange('deep_crawl_enabled', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
              </div>
            </div>
          </div>
        )}

      </main>

    </div>
  );
}
