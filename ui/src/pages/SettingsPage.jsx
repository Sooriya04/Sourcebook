import React, { useState, useEffect } from 'react';
import { Save, Search, Server, Cpu, Database, Settings, PlayCircle } from 'lucide-react';
import { fetchSettings, updateSettings } from '../services/sourcebookApi';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    search_provider: 'duckduckgo',
    max_sources: 5,
    searxng_split: 3,
    ddg_split: 2,
    youtube_enabled: false,
    youtube_max_sources: 3,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await fetchSettings();
      // Load local youtube settings since backend doesn't persist them yet
      const ytEnabled = localStorage.getItem('youtube_enabled') === 'true';
      const ytMax = parseInt(localStorage.getItem('youtube_max_sources')) || 3;
      
      setSettings({
        ...data,
        youtube_enabled: ytEnabled,
        youtube_max_sources: ytMax
      });
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveMessage('');
    try {
      // Save youtube settings to local storage
      localStorage.setItem('youtube_enabled', settings.youtube_enabled);
      localStorage.setItem('youtube_max_sources', settings.youtube_max_sources);

      // Save backend settings
      await updateSettings(settings);
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
      <div className="not-found-container">
        <h2>Loading Settings...</h2>
      </div>
    );
  }

  return (
    <div className="settings-page" style={{ padding: '40px', maxWidth: '800px', margin: '0 auto', color: 'var(--text-main)', width: '100%', height: '100%', overflowY: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '30px' }}>
        <Settings size={28} color="var(--accent-primary)" />
        <h1 style={{ fontSize: '1.8rem', fontWeight: 600 }}>SourceBook Settings</h1>
      </div>

      <div className="settings-card" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Search size={20} color="var(--accent-primary)" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>Web Search Configuration</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
          Configure which search engine SourceBook uses to discover URLs during agentic synthesis.
        </p>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Search Provider</label>
          <select 
            value={settings.search_provider} 
            onChange={(e) => handleChange('search_provider', e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
          >
            <option value="duckduckgo">DuckDuckGo (Fast, No CAPTCHAs)</option>
            <option value="searxng">SearXNG (Private, Comprehensive)</option>
            <option value="both">Both (Parallel Search)</option>
          </select>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Total Max Sources</label>
          <input 
            type="number" 
            value={settings.max_sources} 
            onChange={(e) => handleChange('max_sources', parseInt(e.target.value) || 5)}
            min="1" max="20"
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
          />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '6px' }}>Maximum number of web pages scraped per query.</p>
        </div>

        {settings.search_provider === 'both' && (
          <div style={{ background: 'var(--bg-app)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Parallel Routing Split</h3>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                <span>SearXNG Sources</span>
                <span>{settings.searxng_split}</span>
              </label>
              <input 
                type="range" 
                value={settings.searxng_split} 
                onChange={(e) => handleChange('searxng_split', parseInt(e.target.value))}
                min="0" max="10"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                <span>DuckDuckGo Sources</span>
                <span>{settings.ddg_split}</span>
              </label>
              <input 
                type="range" 
                value={settings.ddg_split} 
                onChange={(e) => handleChange('ddg_split', parseInt(e.target.value))}
                min="0" max="10"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="settings-card" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '12px', border: '1px solid var(--border-color)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <PlayCircle size={20} color="#ff0000" />
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600 }}>YouTube Agent Integration</h2>
        </div>
        <p style={{ color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>
          Enable YouTube integration to automatically search and transcribe videos during synthesis.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', padding: '16px', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 500 }}>Enable YouTube Search</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '4px' }}>Automatically fetch transcripts for relevant queries.</p>
          </div>
          <label className="toggle-switch" style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
            <input 
              type="checkbox" 
              checked={settings.youtube_enabled}
              onChange={(e) => handleChange('youtube_enabled', e.target.checked)}
              style={{ opacity: 0, width: 0, height: 0 }}
            />
            <span style={{ 
              position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, 
              backgroundColor: settings.youtube_enabled ? 'var(--accent-primary)' : '#4b5563', 
              transition: '.4s', borderRadius: '24px' 
            }}>
              <span style={{
                position: 'absolute', content: '""', height: '18px', width: '18px', left: '3px', bottom: '3px',
                backgroundColor: 'white', transition: '.4s', borderRadius: '50%',
                transform: settings.youtube_enabled ? 'translateX(20px)' : 'translateX(0)'
              }}></span>
            </span>
          </label>
        </div>

        {settings.youtube_enabled && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Max YouTube Sources</label>
            <input 
              type="number" 
              value={settings.youtube_max_sources} 
              onChange={(e) => handleChange('youtube_max_sources', parseInt(e.target.value) || 3)}
              min="1" max="10"
              style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
            />
            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '6px' }}>Maximum number of video transcripts to fetch per query.</p>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={() => navigate('/')}
          style={{ padding: '10px 20px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-main)', borderRadius: '8px', cursor: 'pointer' }}
        >
          Back to Home
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {saveMessage && <span style={{ color: saveMessage.includes('Error') ? '#ef4444' : '#10b981', fontSize: '0.9rem' }}>{saveMessage}</span>}
          <button 
            onClick={handleSave}
            disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', background: 'var(--accent-primary)', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' }}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
