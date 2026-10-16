import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

export default function CommandPaletteModal({ isOpen, onClose, commands }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const filtered = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(query.toLowerCase()) ||
    cmd.type.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (filtered.length ? (prev + 1) % filtered.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  useEffect(() => {
    const activeEl = listRef.current?.children[selectedIndex];
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="command-palette-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(9, 9, 11, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        justifyContent: 'center',
        paddingTop: '12vh',
        zIndex: 1100
      }}
    >
      <div
        className="command-palette-box"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '560px',
          maxHeight: '420px',
          backgroundColor: '#18181b', // zinc-900
          border: '1px solid #27272a', // zinc-800
          borderRadius: '12px',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.75)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        {/* Search Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 16px',
            borderBottom: '1px solid #27272a'
          }}
        >
          <Search size={17} style={{ color: '#71717a' }} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search sources..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#f4f4f5',
              fontSize: '0.9rem',
              fontFamily: 'inherit'
            }}
          />
          <span
            style={{
              fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
              fontSize: '0.68rem',
              color: '#71717a',
              backgroundColor: '#27272a',
              padding: '2px 6px',
              borderRadius: '4px'
            }}
          >
            ESC
          </span>
        </div>

        {/* Command List */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filtered.length > 0 ? (
            filtered.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={idx}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '7px',
                    cursor: 'pointer',
                    fontSize: '0.84rem',
                    color: isSelected ? '#ffffff' : '#d4d4d8',
                    backgroundColor: isSelected ? '#27272a' : 'transparent',
                    borderLeft: isSelected ? '3px solid #6366f1' : '3px solid transparent',
                    transition: 'background-color 0.12s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: isSelected ? '#a5b4fc' : '#71717a', display: 'flex' }}>
                      {cmd.icon}
                    </span>
                    <span>{cmd.label}</span>
                  </div>
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
                      fontSize: '0.66rem',
                      color: isSelected ? '#818cf8' : '#71717a',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em'
                    }}
                  >
                    {cmd.type}
                  </span>
                </div>
              );
            })
          ) : (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: '#71717a', fontSize: '0.82rem' }}>
              No commands or sources matching "{query}".
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
