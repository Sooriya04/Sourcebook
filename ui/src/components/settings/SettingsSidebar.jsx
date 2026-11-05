import React from 'react';
import { ArrowLeft, Cpu, Search, Globe, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TABS = [
  { id: 'llm', label: 'AI & Model Provider', icon: <Cpu size={16} /> },
  { id: 'search', label: 'Search Engine', icon: <Search size={16} /> },
  { id: 'media', label: 'Crawling & Media', icon: <Globe size={16} /> },
  { id: 'embedding', label: 'Vector & Embeddings', icon: <Layers size={16} /> }
];

export default function SettingsSidebar({ activeTab, setActiveTab }) {
  const navigate = useNavigate();

  return (
    <aside className="settings-sidebar-panel">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="settings-back-btn"
      >
        <ArrowLeft size={14} />
        <span>Back to Notebooks</span>
      </button>

      <div className="settings-sidebar-label">
        Workspace Settings
      </div>

      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`settings-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">
              {tab.icon}
            </span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </aside>
  );
}
