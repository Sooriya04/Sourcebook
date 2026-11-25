import React, { useState, forwardRef, useEffect } from 'react';
import SlashMenu from './SlashMenu';
import { SLASH_COMMANDS } from './slashCommands';
import UrlDetectedBanner from './UrlDetectedBanner';
import SourcesCountBadge from './SourcesCountBadge';
import PromptActionButtons from './PromptActionButtons';

const PromptBar = forwardRef(function PromptBar(
  { onSend, onStop, onAddUrl, loading, sourceCount = 0, scopedCount },
  ref
) {
  const [query, setQuery] = useState('');
  const [showSlash, setShowSlash] = useState(false);
  const [slashIdx, setSlashIdx] = useState(0);
  const [detectedUrl, setDetectedUrl] = useState(null);

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
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashIdx((p) => (p + 1) % SLASH_COMMANDS.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashIdx((p) => (p - 1 + SLASH_COMMANDS.length) % SLASH_COMMANDS.length);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        selectCommand(SLASH_COMMANDS[slashIdx]);
        return;
      }
      if (e.key === 'Escape') {
        setShowSlash(false);
        return;
      }
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
    if (ref?.current) {
      ref.current.style.height = 'auto';
      ref.current.focus();
    }
  };

  return (
    <div className="chat-composer-shell">
      <div className="chat-composer-inner">
        {showSlash && (
          <SlashMenu
            commands={SLASH_COMMANDS}
            selectedIndex={slashIdx}
            onSelect={selectCommand}
          />
        )}
        {detectedUrl && (
          <UrlDetectedBanner
            url={detectedUrl}
            onIngest={(u) => {
              onAddUrl(u);
              setQuery((prev) => prev.replace(u, '').trim());
              setDetectedUrl(null);
            }}
            onDismiss={() => setDetectedUrl(null)}
          />
        )}

        <form onSubmit={handleSubmit} className="chat-composer-box">
          <textarea
            ref={ref}
            placeholder="Ask a research question, or type / for commands..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
            }}
            onKeyDown={handleKeyDown}
            rows={1}
            className="chat-composer-textarea"
          />

          <div className="chat-composer-toolbar">
            <div className="chat-composer-meta">
              <SourcesCountBadge sourceCount={sourceCount} scopedCount={scopedCount} />
              <span className="chat-composer-hint">Enter to send · Shift+Enter for newline</span>
            </div>

            <PromptActionButtons
              query={query}
              loading={loading}
              onClear={handleClear}
              onStop={onStop}
            />
          </div>
        </form>

        <div className="chat-composer-disclaimer">
          SourceBook grounds answers in your sources — verify critical citations against originals.
        </div>
      </div>
    </div>
  );
});

export default PromptBar;
