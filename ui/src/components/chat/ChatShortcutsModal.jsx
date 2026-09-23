import React from 'react';
import { Keyboard, X } from 'lucide-react';

export default function ChatShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const shortcuts = [
    { label: 'Focus Prompt Bar', key: '⌘ K' },
    { label: 'Toggle Sources Panel', key: '⌘ /' },
    { label: 'Toggle Studio Panel', key: '⌘ Shift S' },
    { label: 'Show Shortcuts Menu', key: '⌘ Shift ?' },
    { label: 'Close Popovers / Modals', key: 'Esc' },
    { label: 'Send Query', key: 'Enter' },
    { label: 'New Line in Prompt', key: 'Shift Enter' }
  ];

  return (
    <div className="shortcuts-modal-overlay" onClick={onClose}>
      <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
        <div className="shortcuts-modal-header" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '14px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 600 }}>
            <Keyboard size={16} color="var(--accent-primary, #3b82f6)" />
            <span>Keyboard Shortcuts</span>
          </div>
          <button 
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-dim, #71717a)', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="shortcuts-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {shortcuts.map((item, idx) => (
            <div key={idx} className="shortcut-item" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              fontSize: '0.8rem', color: 'var(--text-main, #f4f4f5)'
            }}>
              <span>{item.label}</span>
              <span className="shortcut-key-badge" style={{
                background: 'rgba(255, 255, 255, 0.06)', border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '4px', padding: '2px 6px', fontSize: '0.7rem', fontFamily: 'monospace'
              }}>
                {item.key}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
