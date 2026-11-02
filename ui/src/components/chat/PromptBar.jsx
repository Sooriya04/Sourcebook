import React, { useState, forwardRef, useEffect } from 'react';
import SlashMenu from './SlashMenu';
import { SLASH_COMMANDS } from './slashCommands';
import UrlDetectedBanner from './UrlDetectedBanner';
import SourcesCountBadge from './SourcesCountBadge';
import PromptActionButtons from './PromptActionButtons';

const PromptBar = forwardRef(function PromptBar({ onSend, onStop, onAddUrl, loading, sourceCount = 0, scopedCount }, ref) {
  const [query, setQuery] = useState('');
  const [showSlash, setShowSlash] = useState(false);
  const [slashIdx, setSlashIdx] = useState(0);
  const [detectedUrl, setDetectedUrl] = useState(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setShowSlash(query.startsWith('/'));
    setSlashIdx(0);
    const urlMatch = query.match(/(https?:\/\/[^\s]+|youtu\.be\/[^\s]+)/i);
    setDetectedUrl(urlMatch && onAddUrl ? urlMatch[0] : null);
  }, [query, onAddUrl]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;
    onSend(query.trim());
    setQuery('');
    setShowSlash(false);
    setDetectedUrl(null);
    if (ref?.current) ref.current.style.height = 'auto';
  };

  const selectCommand = (cmd) => {
    setQuery(cmd.prompt);
    setShowSlash(false);
    if (ref?.current) {
      ref.current.style.height = 'auto';
      ref.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (showSlash) {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSlashIdx(p => (p + 1) % SLASH_COMMANDS.length); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSlashIdx(p => (p - 1 + SLASH_COMMANDS.length) % SLASH_COMMANDS.length); return; }
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); selectCommand(SLASH_COMMANDS[slashIdx]); return; }
      if (e.key === 'Escape') { setShowSlash(false); return; }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape' && loading && onStop) {
      onStop();
    }
  };

  const handleClear = () => {
    setQuery('');
    setShowSlash(false);
    if (ref?.current) { ref.current.style.height = 'auto'; ref.current.focus(); }
  };

  return (
    <div style={{ width: '100%', maxWidth: '780px', margin: '0 auto', padding: '0 16px 12px', position: 'relative' }}>
      {showSlash && <SlashMenu commands={SLASH_COMMANDS} selectedIndex={slashIdx} onSelect={selectCommand} />}
      {detectedUrl && (
        <UrlDetectedBanner
          url={detectedUrl}
          onIngest={(u) => { onAddUrl(u); setQuery(prev => prev.replace(u, '').trim()); setDetectedUrl(null); }}
          onDismiss={() => setDetectedUrl(null)}
        />
      )}

      <form
        onSubmit={handleSubmit}
        style={{
          background: '#1e2025',
          border: isFocused ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.15), 0 8px 24px rgba(0, 0, 0, 0.4)' : '0 8px 24px rgba(0, 0, 0, 0.3)',
          borderRadius: '9999px',
          padding: '8px 12px 8px 18px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        }}
      >
        <SourcesCountBadge sourceCount={sourceCount} scopedCount={scopedCount} />

        <textarea
          ref={ref}
          placeholder="Ask a question or create something..."
          value={query}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onChange={(e) => {
            setQuery(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
          }}
          onKeyDown={handleKeyDown}
          rows={1}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#f4f4f5',
            fontSize: '0.88rem',
            lineHeight: '1.45',
            resize: 'none',
            padding: '4px 0',
            fontFamily: 'inherit',
            maxHeight: '160px',
            overflowY: 'auto'
          }}
        />

        <PromptActionButtons query={query} loading={loading} onClear={handleClear} onStop={onStop} />
      </form>

      <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '0.7rem', color: '#9ca3af' }}>
        SourceBook may display inaccurate info, so verify its answers against original sources.
      </div>
    </div>
  );
});

export default PromptBar;
