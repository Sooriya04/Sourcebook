import React from 'react';
import { PanelLeftOpen, PanelRightOpen, Keyboard, Trash2, BookOpen, Globe, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ChatHeader({
  isSourcesCollapsed,
  onToggleSources,
  isStudioCollapsed,
  onToggleStudio,
  mode,
  setMode,
  llmHealth,
  onOpenShortcuts,
  onClearChat
}) {
  const navigate = useNavigate();

  return (
    <div className="chat-panel-header" style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      height: '48px',
      borderBottom: '1px solid var(--border-color)',
      background: 'var(--canvas)',
      flexShrink: 0,
      gap: '8px',
      whiteSpace: 'nowrap',
      overflow: 'hidden'
    }}>
      {/* Left: Section title & expand source button if collapsed */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {isSourcesCollapsed && (
          <button 
            type="button"
            className="panel-toggle-btn"
            onClick={onToggleSources}
            title="Expand Sources Panel (Cmd+/)"
            style={{ padding: '5px', borderRadius: '6px', color: 'var(--text-muted)' }}
          >
            <PanelLeftOpen size={16} />
          </button>
        )}
        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main, #f4f4f5)' }}>
          Chat
        </span>
      </div>

      {/* Center: NotebookLM Segmented Mode Switcher */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '2px',
        flexShrink: 0
      }}>
        {[
          { id: 'notebook', label: 'Sources', icon: <BookOpen size={12} /> },
          { id: 'web', label: 'Web', icon: <Globe size={12} /> },
          { id: 'hybrid', label: 'Hybrid', icon: <Sparkles size={12} /> }
        ].map(item => {
          const isActive = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              style={{
                padding: '4px 12px',
                borderRadius: '14px',
                border: 'none',
                background: isActive ? '#f4f4f5' : 'transparent',
                color: isActive ? '#09090b' : 'var(--text-muted, #a1a1aa)',
                fontSize: '0.74rem',
                fontWeight: isActive ? 600 : 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.15s ease',
                boxShadow: isActive ? '0 1px 3px rgba(0, 0, 0, 0.3)' : 'none'
              }}
            >
              {React.cloneElement(item.icon, {
                color: isActive ? '#09090b' : 'var(--text-muted, #a1a1aa)'
              })}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <div 
          onClick={() => navigate('/settings')}
          title={llmHealth?.status === 'online' ? `${llmHealth.model} (Online)` : 'LLM Offline (Click to configure in Settings)'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            cursor: 'pointer',
            padding: '3px 8px',
            borderRadius: '12px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            fontSize: '0.7rem'
          }}
        >
          <span style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: llmHealth?.status === 'online' ? '#10b981' : (llmHealth?.status === 'checking' ? '#f59e0b' : '#ef4444'),
            boxShadow: llmHealth?.status === 'online' ? '0 0 6px #10b981' : 'none'
          }}></span>
          <span style={{ color: 'var(--text-muted, #a1a1aa)', maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {llmHealth?.status === 'online' ? (llmHealth.model?.split('/')?.pop() || 'Online') : 'Offline'}
          </span>
        </div>

        <button 
          type="button"
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts (⌘?)"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted, #a1a1aa)',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '6px',
            display: 'grid',
            placeItems: 'center'
          }}
        >
          <Keyboard size={14} />
        </button>

        <button 
          type="button"
          onClick={onClearChat}
          title="Clear chat history"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted, #a1a1aa)',
            cursor: 'pointer',
            padding: '5px',
            borderRadius: '6px',
            display: 'grid',
            placeItems: 'center'
          }}
        >
          <Trash2 size={14} />
        </button>

        {isStudioCollapsed && (
          <button 
            type="button"
            className="panel-toggle-btn"
            onClick={onToggleStudio}
            title="Expand Studio (Cmd+Shift+S)"
            style={{ padding: '5px', borderRadius: '6px', color: 'var(--text-muted)' }}
          >
            <PanelRightOpen size={16} />
          </button>
        )}
      </div>
    </div>
  );
}
