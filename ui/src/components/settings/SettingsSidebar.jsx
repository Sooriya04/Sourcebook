import React from 'react';
import { ArrowLeft, Cpu, Search, Globe, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SettingsSidebar({ activeTab, setActiveTab }) {
  const navigate = useNavigate();

  const tabs = [
    { id: 'llm', label: 'AI & Model Provider', icon: <Cpu size={18} /> },
    { id: 'search', label: 'Web Search Engine', icon: <Search size={18} /> },
    { id: 'media', label: 'Crawling & Media', icon: <Globe size={18} /> },
    { id: 'embedding', label: 'Vector & Embeddings', icon: <Layers size={18} /> }
  ];

  return (
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
  );
}
