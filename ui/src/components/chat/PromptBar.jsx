import React, { useState, forwardRef, useEffect } from 'react';
import { ArrowUp, Layers, Square, Globe, Sparkles, HelpCircle, BookOpen, Scale } from 'lucide-react';

const COMMANDS = [
  { cmd: '/summarize', label: 'Summarize Sources', icon: <BookOpen size={12} />, prompt: 'Synthesize an executive summary of all key findings from the selected sources.' },
  { cmd: '/explain', label: 'Deep Explanation', icon: <Sparkles size={12} />, prompt: 'Explain the core mechanisms, concepts, and steps detailed in the sources in simple terms.' },
  { cmd: '/compare', label: 'Compare & Contrast', icon: <Scale size={12} />, prompt: 'Compare perspectives, identify agreements, and highlight contradictions across the sources.' },
  { cmd: '/quiz', label: 'Study Flashcards', icon: <HelpCircle size={12} />, prompt: 'Generate 5 conceptual study questions and answers based strictly on the retrieved sources.' }
];

const PromptBar = forwardRef(function PromptBar({ onSend, onStop, onAddUrl, loading, sourceCount = 0, scopedCount }, ref) {
  const [query, setQuery] = useState('');
  const [showSlash, setShowSlash] = useState(false);
  const [detectedUrl, setDetectedUrl] = useState(null);

  useEffect(() => {
    setShowSlash(query.startsWith('/'));
    const urlMatch = query.match(/(https?:\/\/[^\s]+|youtu\.be\/[^\s]+)/i);
    setDetectedUrl(urlMatch && onAddUrl ? urlMatch[0] : null);
  }, [query, onAddUrl]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!query.trim() || loading) return;
    onSend(query);
    setQuery('');
    setShowSlash(false);
    setDetectedUrl(null);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setShowSlash(false);
      if (loading && onStop) onStop();
    }
  };

  return (
    <div className="prompt-area" style={{ width: '100%', maxWidth: '780px', margin: '0 auto', padding: '0 16px 10px', position: 'relative', boxSizing: 'border-box' }}>
      {showSlash && (
        <div style={{
          position: 'absolute', bottom: '100%', left: '20px', marginBottom: '8px',
          background: 'var(--panel, #18181b)', border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '12px', padding: '4px', boxShadow: '0 12px 32px rgba(0,0,0,0.6)',
          zIndex: 40, minWidth: '260px', display: 'flex', flexDirection: 'column'
        }}>
          <div style={{ fontSize: '0.64rem', color: 'var(--text-dim, #71717a)', padding: '4px 8px', fontWeight: 600 }}>PROMPT COMMANDS</div>
          {COMMANDS.map(c => (
            <button key={c.cmd} type="button" onClick={() => { setQuery(c.prompt); setShowSlash(false); ref?.current?.focus(); }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', borderRadius: '6px', border: 'none', background: 'transparent', color: 'var(--text-main, #f4f4f5)', fontSize: '0.76rem', cursor: 'pointer', textAlign: 'left' }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ color: 'var(--accent-primary, #3b82f6)' }}>{c.icon}</span>
              <span style={{ fontWeight: 600 }}>{c.cmd}</span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-dim, #71717a)' }}>— {c.label}</span>
            </button>
          ))}
        </div>
      )}

      {detectedUrl && (
        <div style={{
          position: 'absolute', bottom: '100%', right: '24px', marginBottom: '8px',
          display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(59, 130, 246, 0.15)',
          border: '1px solid rgba(59, 130, 246, 0.4)', borderRadius: '20px', padding: '4px 12px',
          fontSize: '0.72rem', color: '#fff', zIndex: 30, backdropFilter: 'blur(8px)'
        }}>
          <Globe size={13} color="var(--accent-primary, #3b82f6)" />
          <span>Link detected</span>
          <button type="button" onClick={() => { onAddUrl(detectedUrl); setQuery(prev => prev.replace(detectedUrl, '').trim()); setDetectedUrl(null); }}
            style={{ background: 'var(--accent-primary, #3b82f6)', color: '#fff', border: 'none', borderRadius: '12px', padding: '2px 8px', fontSize: '0.66rem', fontWeight: 600, cursor: 'pointer' }}
          >
            + Ingest as Source
          </button>
        </div>
      )}

      {/* Floating Pill Dock */}
      <form className="prompt-bar" onSubmit={handleSubmit} style={{
        background: 'rgba(22, 24, 30, 0.94)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '26px',
        padding: '8px 12px 8px 16px', display: 'flex', alignItems: 'center', gap: '10px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)'
      }}>
        <div className="sources-count-pill" style={{
          background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)',
          padding: '4px 10px', borderRadius: '14px', fontSize: '0.72rem', color: 'var(--text-muted, #a1a1aa)',
          display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0
        }}>
          <Layers size={13} color="var(--accent-primary, #3b82f6)" />
          <span style={{ fontWeight: 500 }}>
            {scopedCount !== undefined && scopedCount !== sourceCount ? `${scopedCount}/${sourceCount}` : `${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'}`}
          </span>
        </div>

        <textarea ref={ref} className="prompt-input" placeholder="Ask a question about your sources... (⌘K)"
          value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={handleKeyDown} rows={1}
          style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: '0.9rem', lineHeight: '1.4', resize: 'none', padding: '4px 0', fontFamily: 'inherit' }}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          {loading ? (
            <button type="button" onClick={onStop} title="Stop generating (Esc)"
              style={{ width: '34px', height: '34px', borderRadius: '50%', background: '#ef4444', color: '#fff', border: 'none', display: 'grid', placeItems: 'center', cursor: 'pointer', boxShadow: '0 0 10px rgba(239, 68, 68, 0.4)' }}
            >
              <Square size={12} fill="#fff" />
            </button>
          ) : (
            <button type="submit" disabled={!query.trim()} title="Send query (Enter)"
              style={{
                width: '34px', height: '34px', borderRadius: '50%', border: 'none',
                background: query.trim() ? '#f4f4f5' : 'rgba(255, 255, 255, 0.08)',
                color: query.trim() ? '#09090b' : 'rgba(255, 255, 255, 0.3)',
                display: 'grid', placeItems: 'center', cursor: query.trim() ? 'pointer' : 'not-allowed',
                boxShadow: query.trim() ? '0 2px 8px rgba(0, 0, 0, 0.3)' : 'none'
              }}
            >
              <ArrowUp size={17} color={query.trim() ? '#09090b' : 'rgba(255, 255, 255, 0.3)'} />
            </button>
          )}
        </div>
      </form>

      <div style={{ textAlign: 'center', marginTop: '6px', fontSize: '0.66rem', color: 'var(--text-dim, #71717a)' }}>
        SourceBook may display inaccurate info, so verify its answers against original sources.
      </div>
    </div>
  );
});

export default PromptBar;
