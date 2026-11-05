import React from 'react';
import { PanelLeftOpen, PanelRightOpen } from 'lucide-react';

export default function ChatHeader(props) {
  const { isSourcesCollapsed, onToggleSources, isStudioCollapsed, onToggleStudio } = props;

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '40px', borderBottom: 'none', background: '#0e0f12', flexShrink: 0, gap: '8px', whiteSpace: 'nowrap' }}>
      {/* Left: Sources panel toggle if collapsed */}
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
          >
            <PanelLeftOpen size={14} />
            <span style={{ fontWeight: 500 }}>Sources</span>
          </button>
        )}
      </div>

      {/* Right: Studio toggle if collapsed */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
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
          >
            <span style={{ fontWeight: 500 }}>Studio</span>
            <PanelRightOpen size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
