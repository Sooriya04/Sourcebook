import React from 'react';
import { Home, Plus, Settings, Download, BookOpen, Globe, Sparkles, Keyboard, Trash2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SentinelStatus from '../layout/SentinelStatus';

const MODES = [
  { id: 'notebook', label: 'Sources', icon: <BookOpen size={13} /> },
  { id: 'web', label: 'Web', icon: <Globe size={13} /> },
  { id: 'hybrid', label: 'Hybrid', icon: <Sparkles size={13} /> }
];

export default function NotebookHeader({ 
  title, 
  notebookId, 
  onExport,
  mode,
  setMode,
  llmHealth,
  onOpenShortcuts,
  onClearChat,
  onCreateNotebook
}) {
  const navigate = useNavigate();

  const isOnline = llmHealth?.status === 'online';
  const isChecking = llmHealth?.status === 'checking';
  const statusColor = isOnline ? '#10b981' : isChecking ? '#f59e0b' : '#ef4444';
  const modelName = isOnline ? (llmHealth.model?.split('/')?.pop() || 'Online') : 'Offline';

  return (
    <header className="notebook-header-tasteful">
      {/* Left: Home Button + Notebook Title + Synced badge */}
      <div className="header-left-cluster">
        <Link 
          to="/" 
          className="header-brand-icon" 
          title="Home — Back to Notebooks"
          aria-label="Back to notebooks"
        >
          <div className="brand-logo-glow">
            <Home size={18} color="#c4c7c5" />
          </div>
        </Link>
        <h2 className="header-notebook-title">{title}</h2>
        <SentinelStatus notebookId={notebookId} />
      </div>

      {/* Center: Sources | Web | Hybrid & LLM controls */}
      <div className="header-center-controls">
        {setMode && (
          <div className="header-mode-switcher">
            {MODES.map(item => {
              const isActive = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setMode(item.id)}
                  className={`header-mode-btn ${isActive ? 'active' : ''}`}
                >
                  {React.cloneElement(item.icon, { color: isActive ? '#38bdf8' : '#8e918f' })}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {llmHealth && (
          <div
            onClick={() => navigate('/settings')}
            title={isOnline ? `${llmHealth.model} (Online)` : 'LLM Offline (Click to configure)'}
            className="header-llm-badge"
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor }} />
            <span style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {modelName}
            </span>
          </div>
        )}

        {onOpenShortcuts && (
          <button 
            type="button" 
            onClick={onOpenShortcuts} 
            title="Keyboard shortcuts (⌘?)" 
            className="header-icon-btn"
          >
            <Keyboard size={15} />
          </button>
        )}

        {onClearChat && (
          <button
            type="button"
            onClick={onClearChat}
            title="Clear chat history"
            className="header-icon-btn clear"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Right: + Create notebook + Download + Settings */}
      <div className="header-right-actions">
        <button 
          type="button"
          className="header-action-pill" 
          onClick={onCreateNotebook || (() => navigate('/'))}
          title="Create new notebook"
        >
          <Plus size={15} />
          <span>Create notebook</span>
        </button>

        <button 
          type="button"
          className="header-icon-btn" 
          onClick={onExport}
          title="Export Markdown"
        >
          <Download size={16} />
        </button>

        <button 
          type="button"
          className="header-icon-btn" 
          onClick={() => navigate('/settings')}
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}
