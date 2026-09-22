import React, { useState, forwardRef, useEffect } from 'react';
import { ArrowRight, Layers, Square, Globe, Sparkles, HelpCircle, BookOpen, Scale } from 'lucide-react';

const SLASH_COMMANDS = [
  { cmd: '/summarize', label: 'Summarize Sources', icon: <BookOpen size={13} />, prompt: 'Synthesize an executive summary of all key findings from the selected sources.' },
  { cmd: '/explain', label: 'Deep Explanation', icon: <Sparkles size={13} />, prompt: 'Explain the core mechanisms, concepts, and steps detailed in the sources in simple terms.' },
  { cmd: '/compare', label: 'Compare & Contrast', icon: <Scale size={13} />, prompt: 'Compare perspectives, identify agreements, and highlight contradictions across the sources.' },
  { cmd: '/quiz', label: 'Study Flashcards', icon: <HelpCircle size={13} />, prompt: 'Generate 5 conceptual study questions and answers based strictly on the retrieved sources.' }
];

const PromptBar = forwardRef(function PromptBar({ onSend, onStop, onAddUrl, loading, sourceCount = 0, scopedCount }, ref) {
  const [query, setQuery] = useState('');
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [detectedUrl, setDetectedUrl] = useState(null);

  useEffect(() => {
    setShowSlashMenu(query.startsWith('/'));
    const urlMatch = query.match(/(https?:\/\/[^\s]+|youtu\.be\/[^\s]+)/i);
    setDetectedUrl(urlMatch && onAddUrl ? urlMatch[0] : null);
  }, [query, onAddUrl]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;
    onSend(query);
    setQuery('');
    setShowSlashMenu(false);
    setDetectedUrl(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setShowSlashMenu(false);
      if (loading && onStop) onStop();
    }
  };

  const selectSlashCommand = (item) => {
    setQuery(item.prompt);
    setShowSlashMenu(false);
    if (ref?.current) ref.current.focus();
  };

  const handleAddDetectedUrl = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (detectedUrl && onAddUrl) {
      onAddUrl(detectedUrl);
      setQuery(prev => prev.replace(detectedUrl, '').trim());
      setDetectedUrl(null);
    }
  };

  return (
    <div className="prompt-area" style={{ position: 'relative' }}>
      {showSlashMenu && (
        <div className="slash-commands-popup" style={{
          position: 'absolute', bottom: '100%', left: '12px', marginBottom: '8px',
          background: 'var(--panel, #18181b)', border: '1px solid var(--line, #27272a)',
          borderRadius: '10px', padding: '6px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          zIndex: 40, minWidth: '260px', display: 'flex', flexDirection: 'column', gap: '2px'
        }}>
          <div style={{ fontSize: '0.68rem', color: 'var(--muted)', padding: '4px 8px', fontWeight: 600 }}>COMMAND SHORTCUTS</div>
          {SLASH_COMMANDS.map((item) => (
            <button
              key={item.cmd}
              type="button"
              onClick={() => selectSlashCommand(item)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px',
                borderRadius: '6px', border: 'none', background: 'transparent',
                color: 'var(--paper, #f4f4f5)', fontSize: '0.78rem', cursor: 'pointer', textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--panel-3, #27272a)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ color: 'var(--accent, #3b82f6)' }}>{item.icon}</span>
              <span style={{ fontWeight: 600 }}>{item.cmd}</span>
              <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>— {item.label}</span>
            </button>
          ))}
        </div>
      )}

      {detectedUrl && (
        <div style={{
          position: 'absolute', bottom: '100%', right: '16px', marginBottom: '8px',
          display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--panel-2, #27272a)',
          border: '1px solid var(--accent, #3b82f6)', borderRadius: '20px', padding: '4px 12px',
          fontSize: '0.72rem', color: 'var(--paper, #f4f4f5)', zIndex: 30
        }}>
          <Globe size={13} color="var(--accent, #3b82f6)" />
          <span>Link detected:</span>
          <button
            type="button"
            onClick={handleAddDetectedUrl}
            style={{
              background: 'var(--accent, #3b82f6)', color: '#fff', border: 'none',
              borderRadius: '12px', padding: '2px 8px', fontSize: '0.68rem', fontWeight: 600, cursor: 'pointer'
            }}
          >
            + Ingest as Source
          </button>
        </div>
      )}

      <form className="prompt-bar" onSubmit={handleSubmit}>
        <textarea
          ref={ref}
          className="prompt-input"
          placeholder="Ask a question or type '/' for prompt commands... (⌘K)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
        
        <div className="prompt-controls-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div 
            className="sources-count-pill" 
            title={scopedCount !== undefined && scopedCount !== sourceCount 
              ? `${scopedCount} of ${sourceCount} sources active in chat scope` : "Active notebook sources indexed"}
          >
            <Layers size={13} />
            <span>
              {scopedCount !== undefined && scopedCount !== sourceCount
                ? `${scopedCount}/${sourceCount} sources`
                : `${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'}`}
            </span>
          </div>

          {loading ? (
            <button
              type="button"
              className="circular-send-btn stop-active"
              onClick={onStop}
              title="Stop generating (Esc)"
              style={{ background: '#ef4444', color: '#fff', borderColor: '#ef4444', display: 'grid', placeItems: 'center' }}
            >
              <Square size={13} fill="#fff" />
            </button>
          ) : (
            <button type="submit" className="circular-send-btn" disabled={!query.trim()} title="Send query (Enter)">
              <ArrowRight size={18} />
            </button>
          )}
        </div>
      </form>
    </div>
  );
});

export default PromptBar;
