import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Globe, Sparkles, ChevronRight, Copy, Check, Clock, FileText, MessageSquare } from 'lucide-react';

export default function SourceInspector({
  source,
  onClose,
  onExplainSource,
  onChatWithSource
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!source) return null;

  const rawContent = source.content || source.Content || source.text || source.Text || 
                     source.snippet || source.Snippet || source.description || source.Description || '';
  const wordCount = rawContent ? rawContent.trim().split(/\s+/).length : 0;
  const readTimeMin = Math.max(1, Math.round(wordCount / 200));

  const handleCopy = () => {
    if (!rawContent) return;
    navigator.clipboard.writeText(rawContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getHostname = (url) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="sidebar-header" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <button 
          onClick={onClose} 
          title="Return to Sources list (Esc)"
          style={{
            background: 'var(--canvas-2)',
            border: '1px solid var(--border-color)',
            color: 'var(--text-main)',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '0.72rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <span>← Back to Sources</span>
        </button>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: '600' }}>
          [{source.index || 1}] Inspector
        </span>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 4px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
        <div style={{ fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: '1.4', wordBreak: 'break-word' }}>
          {source.title || 'Untitled Source'}
        </div>

        {/* Metadata Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {wordCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--canvas-2)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              <FileText size={11} />
              <span>{wordCount.toLocaleString()} words</span>
            </div>
          )}
          {readTimeMin > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: 'var(--text-muted)', background: 'var(--canvas-2)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
              <Clock size={11} />
              <span>~{readTimeMin} min read</span>
            </div>
          )}
        </div>

        {/* URL Card */}
        {source.url && (
          <div className="drawer-url-card" style={{ padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--canvas-2)', border: '1px solid var(--border-color)' }}>
            <div className="drawer-url-info" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', minWidth: 0 }}>
              <Globe size={12} className="globe-icon" style={{ flexShrink: 0 }} />
              <span className="drawer-url-domain" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {getHostname(source.url)}
              </span>
            </div>
            <a href={source.url} target="_blank" rel="noreferrer" className="drawer-external-link" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: '600' }}>
              <span>Visit</span>
              <ChevronRight size={12} />
            </a>
          </div>
        )}

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {onExplainSource && (
            <button
              onClick={() => onExplainSource(source)}
              title="Ask AI to explain this source in detail"
              style={{
                background: 'var(--accent-primary)',
                color: 'var(--canvas)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: '600',
                flex: 1,
                justifyContent: 'center'
              }}
            >
              <Sparkles size={11} />
              <span>Explain</span>
            </button>
          )}

          {onChatWithSource && (
            <button
              onClick={() => onChatWithSource(source)}
              title="Scope chat strictly to this source"
              style={{
                background: 'var(--canvas-2)',
                border: '1px solid var(--border-color)',
                color: 'var(--text-main)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: '6px',
                fontSize: '0.7rem',
                fontWeight: '600',
                flex: 1,
                justifyContent: 'center'
              }}
            >
              <MessageSquare size={11} />
              <span>Chat Only</span>
            </button>
          )}

          <button
            className={`drawer-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title="Copy raw text to clipboard"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '0.7rem',
              fontWeight: '600',
              background: 'var(--canvas-2)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)'
            }}
          >
            {copied ? <Check size={11} /> : <Copy size={11} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Text Preview Card */}
        <div className="drawer-text-preview-card" style={{ flex: 1, background: 'var(--canvas-2)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '12px', overflowY: 'auto', fontSize: '0.74rem', color: 'var(--text-main)', lineHeight: '1.5', minHeight: '150px' }}>
          {rawContent ? (
            <div className="markdown-content">
              <ReactMarkdown>{rawContent}</ReactMarkdown>
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No content available.</p>
          )}
        </div>
      </div>
    </div>
  );
}
