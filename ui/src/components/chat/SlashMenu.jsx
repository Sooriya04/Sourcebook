import React from 'react';
import { BookOpen, Sparkles, Scale, HelpCircle } from 'lucide-react';
import { SLASH_COMMANDS } from './slashCommands';

const getCommandIcon = (cmd) => {
  switch (cmd) {
    case '/summarize': return <BookOpen size={13} />;
    case '/explain': return <Sparkles size={13} />;
    case '/compare': return <Scale size={13} />;
    case '/quiz': return <HelpCircle size={13} />;
    default: return <Sparkles size={13} />;
  }
};

export default function SlashMenu({ commands = SLASH_COMMANDS, selectedIndex = 0, onSelect }) {
  if (!commands.length) return null;

  return (
    <div
      role="menu"
      aria-label="Prompt commands"
      style={{
        position: 'absolute',
        bottom: 'calc(100% + 8px)',
        left: '16px',
        background: 'rgba(24, 24, 27, 0.97)',
        border: '1px solid rgba(63, 63, 70, 0.8)',
        borderRadius: '12px',
        padding: '5px',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 50,
        minWidth: '270px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
      }}
    >
      <div style={{ fontSize: '0.64rem', color: '#71717a', padding: '4px 8px 2px', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
        Prompt Commands
      </div>

      {commands.map((c, idx) => {
        const isSelected = idx === selectedIndex;
        return (
          <button
            key={c.cmd}
            type="button"
            role="menuitem"
            onClick={() => onSelect(c)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 8px',
              borderRadius: '7px',
              border: 'none',
              background: isSelected ? 'rgba(39, 39, 42, 0.9)' : 'transparent',
              color: isSelected ? '#f4f4f5' : '#d4d4d8',
              fontSize: '0.76rem',
              cursor: 'pointer',
              textAlign: 'left',
              outline: 'none',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(39, 39, 42, 0.9)'; e.currentTarget.style.color = '#f4f4f5'; }}
            onMouseLeave={(e) => { if (!isSelected) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#d4d4d8'; } }}
          >
            <span style={{ color: '#818cf8', display: 'flex', alignItems: 'center' }}>
              {getCommandIcon(c.cmd)}
            </span>
            <span style={{ fontWeight: 600, fontFamily: "'IBM Plex Mono', monospace" }}>{c.cmd}</span>
            <span style={{ fontSize: '0.72rem', color: '#a1a1aa' }}>— {c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
