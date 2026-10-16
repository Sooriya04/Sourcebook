import React from 'react';
import { ArrowLeft, Cpu, Search, Globe, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SettingsSidebar({ activeTab, setActiveTab }) {
  const navigate = useNavigate();

  const tabs = [
    { id: 'llm', label: 'AI & Model Provider', icon: <Cpu size={16} /> },
    { id: 'search', label: 'Search Engine', icon: <Search size={16} /> },
    { id: 'media', label: 'Crawling & Media', icon: <Globe size={16} /> },
    { id: 'embedding', label: 'Vector & Embeddings', icon: <Layers size={16} /> }
  ];

  return (
    <aside
      style={{
        width: '240px',
        backgroundColor: '#18181b', // zinc-900
        borderRight: '1px solid #27272a', // zinc-800
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        flexShrink: 0
      }}
    >
      <button
        type="button"
        onClick={() => navigate('/')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'transparent',
          border: '1px solid transparent',
          borderRadius: '7px',
          color: '#a1a1aa', // zinc-400
          cursor: 'pointer',
          fontSize: '0.82rem',
          marginBottom: '16px',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#f4f4f5';
          e.currentTarget.style.backgroundColor = '#27272a';
          e.currentTarget.style.borderColor = '#3f3f46';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#a1a1aa';
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
        }}
      >
        <ArrowLeft size={15} />
        <span>Back to Notebooks</span>
      </button>

      <div
        style={{
          fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
          fontSize: '0.68rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          color: '#71717a', // zinc-500
          padding: '0 12px 6px 12px'
        }}
      >
        Workspace Settings
      </div>

      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '9px 12px',
              borderRadius: '8px',
              border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '0.84rem',
              fontWeight: isActive ? 600 : 500,
              backgroundColor: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
              color: isActive ? '#f4f4f5' : '#a1a1aa',
              transition: 'all 0.15s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = '#27272a';
                e.currentTarget.style.color = '#f4f4f5';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#a1a1aa';
              }
            }}
          >
            <span style={{ color: isActive ? '#818cf8' : '#71717a', display: 'flex' }}>
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </aside>
  );
}
