import React from 'react';
import { PanelLeftOpen, PanelRightOpen, Keyboard, Trash2, BookOpen, Globe, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const MODES = [
  { id: 'notebook', label: 'Sources', icon: <BookOpen size={12} /> },
  { id: 'web', label: 'Web', icon: <Globe size={12} /> },
  { id: 'hybrid', label: 'Hybrid', icon: <Sparkles size={12} /> }
];

export default function ChatHeader(props) {
  const { isSourcesCollapsed, onToggleSources, isStudioCollapsed, onToggleStudio, mode, setMode, llmHealth, onOpenShortcuts, onClearChat } = props;
  const navigate = useNavigate();

  const isOnline = llmHealth?.status === 'online';
  const isChecking = llmHealth?.status === 'checking';
  const statusColor = isOnline ? '#10b981' : isChecking ? '#f59e0b' : '#ef4444';
  const modelName = isOnline ? (llmHealth.model?.split('/')?.pop() || 'Online') : 'Offline';

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '48px', borderBottom: 'none', background: '#0e0f12', flexShrink: 0, gap: '8px', whiteSpace: 'nowrap' }}>
      {/* Left: Sources panel toggle and section title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        {isSourcesCollapsed && (
          <button
            type="button"
            onClick={onToggleSources}
            title="Expand Sources Panel (⌘/)"
            aria-label="Expand Sources Panel"
            style={{
              padding: '5px 12px',
              borderRadius: '9999px',
              background: '#18191c',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              color: '#d4d4d8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.76rem',
              transition: 'all 0.15s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.color = '#d4d4d8';
            }}
          >
            <PanelLeftOpen size={14} />
            <span style={{ fontWeight: 500 }}>Sources</span>
          </button>
        )}
        <span style={{ fontSize: '0.92rem', fontWeight: 500, color: '#f4f4f5', letterSpacing: '-0.01em' }}>Chat</span>
      </div>

      {/* Center: Segmented Mode Switcher */}
      <div style={{ display: 'inline-flex', alignItems: 'center', background: '#18191c', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '9999px', padding: '3px', flexShrink: 0 }}>
        {MODES.map(item => {
          const isActive = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              style={{
                padding: '4px 12px', borderRadius: '9999px', border: 'none',
                background: isActive ? '#2b2d35' : 'transparent', color: isActive ? '#f4f4f5' : '#9ca3af',
                fontSize: '0.74rem', fontWeight: isActive ? 500 : 400, cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: '5px', transition: 'all 0.12s ease', outline: 'none'
              }}
            >
              {React.cloneElement(item.icon, { color: isActive ? '#38bdf8' : '#717582' })}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
        <div
          onClick={() => navigate('/settings')}
          title={isOnline ? `${llmHealth.model} (Online)` : 'LLM Offline (Click to configure)'}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', padding: '4px 10px', borderRadius: '9999px', background: '#18191c', border: '1px solid rgba(255, 255, 255, 0.04)', fontSize: '0.72rem', color: '#9ca3af' }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor }} />
          <span style={{ maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 400 }}>{modelName}</span>
        </div>

        <button type="button" onClick={onOpenShortcuts} title="Keyboard shortcuts (⌘?)" style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '5px', borderRadius: '6px', display: 'grid', placeItems: 'center' }}>
          <Keyboard size={14} />
        </button>

        <button
          type="button"
          onClick={onClearChat}
          title="Clear chat history"
          style={{ background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', padding: '5px', borderRadius: '6px', display: 'grid', placeItems: 'center' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#a1a1aa'; }}
        >
          <Trash2 size={14} />
        </button>

        {isStudioCollapsed && (
          <button
            type="button"
            onClick={onToggleStudio}
            title="Expand Studio Panel"
            aria-label="Expand Studio Panel"
            style={{
              padding: '5px 12px',
              borderRadius: '9999px',
              background: '#18191c',
              border: '1px solid rgba(255, 255, 255, 0.04)',
              color: '#d4d4d8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.76rem',
              transition: 'all 0.15s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
              e.currentTarget.style.color = '#d4d4d8';
            }}
          >
            <span style={{ fontWeight: 500 }}>Studio</span>
            <PanelRightOpen size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
