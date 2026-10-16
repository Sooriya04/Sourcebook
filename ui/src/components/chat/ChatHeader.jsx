import React from 'react';
import { PanelLeftOpen, PanelLeftClose, PanelRightOpen, PanelRightClose, Keyboard, Trash2, BookOpen, Globe, Sparkles } from 'lucide-react';
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '48px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: '#09090b', flexShrink: 0, gap: '8px', whiteSpace: 'nowrap' }}>
      {/* Left: Sources panel toggle and section title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <button
          type="button"
          onClick={onToggleSources}
          title={isSourcesCollapsed ? "Expand Sources Panel (⌘/)" : "Collapse Sources Panel (⌘/)"}
          aria-label={isSourcesCollapsed ? "Expand Sources Panel" : "Collapse Sources Panel"}
          style={{
            padding: '4px 8px',
            borderRadius: '8px',
            background: isSourcesCollapsed ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.05)',
            border: isSourcesCollapsed ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)',
            color: isSourcesCollapsed ? '#a5b4fc' : '#d4d4d8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.74rem',
            transition: 'all 0.15s ease',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = isSourcesCollapsed ? 'rgba(99, 102, 241, 0.35)' : 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = isSourcesCollapsed ? '#a5b4fc' : '#d4d4d8';
          }}
        >
          {isSourcesCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
          <span style={{ fontWeight: 500 }}>Sources</span>
        </button>
        <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#f4f4f5', letterSpacing: '-0.01em' }}>Chat</span>
      </div>

      {/* Center: Segmented Mode Switcher */}
      <div style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(24, 24, 27, 0.8)', border: '1px solid #27272a', borderRadius: '12px', padding: '2px', flexShrink: 0 }}>
        {MODES.map(item => {
          const isActive = mode === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setMode(item.id)}
              style={{
                padding: '3px 10px', borderRadius: '9px', border: isActive ? '1px solid #3f3f46' : '1px solid transparent',
                background: isActive ? '#27272a' : 'transparent', color: isActive ? '#f4f4f5' : '#a1a1aa',
                fontSize: '0.72rem', fontWeight: isActive ? 600 : 500, cursor: 'pointer', display: 'flex', alignItems: 'center',
                gap: '5px', transition: 'all 0.12s ease', outline: 'none'
              }}
            >
              {React.cloneElement(item.icon, { color: isActive ? '#818cf8' : '#71717a' })}
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
          style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', padding: '3px 8px', borderRadius: '10px', background: 'rgba(24, 24, 27, 0.6)', border: '1px solid #27272a', fontSize: '0.68rem', color: '#a1a1aa' }}
        >
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: statusColor }} />
          <span style={{ maxWidth: '85px', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500 }}>{modelName}</span>
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

        <button
          type="button"
          onClick={onToggleStudio}
          title={isStudioCollapsed ? "Expand Studio Panel" : "Collapse Studio Panel"}
          aria-label={isStudioCollapsed ? "Expand Studio Panel" : "Collapse Studio Panel"}
          style={{
            padding: '4px 8px',
            borderRadius: '8px',
            background: isStudioCollapsed ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.05)',
            border: isStudioCollapsed ? '1px solid rgba(99, 102, 241, 0.35)' : '1px solid rgba(255, 255, 255, 0.1)',
            color: isStudioCollapsed ? '#a5b4fc' : '#d4d4d8',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.74rem',
            transition: 'all 0.15s ease',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.25)';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = isStudioCollapsed ? 'rgba(99, 102, 241, 0.35)' : 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.color = isStudioCollapsed ? '#a5b4fc' : '#d4d4d8';
          }}
        >
          <span style={{ fontWeight: 500 }}>Studio</span>
          {isStudioCollapsed ? <PanelRightOpen size={14} /> : <PanelRightClose size={14} />}
        </button>
      </div>
    </div>
  );
}
