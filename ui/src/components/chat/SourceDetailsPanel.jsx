import React, { useState } from 'react';
import { BookOpen, Globe, PlayCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function SourceDetailsPanel({ sources = [], _contextMode = '' }) {
  const [expanded, setExpanded] = useState(false);
  if (!sources || sources.length === 0) return null;

  const getSourceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'youtube': return <PlayCircle size={13} color="#f87171" />;
      case 'arxiv': return <FileText size={13} color="#34d399" />;
      case 'notebook': return <BookOpen size={13} color="#818cf8" />;
      default: return <Globe size={13} color="#60a5fa" />;
    }
  };

  const getDisplayDomain = (url) => {
    try {
      return url ? new URL(url).hostname.replace('www.', '') : '';
    } catch {
      return url || '';
    }
  };

  return (
    <div className="source-details-panel" style={{ marginTop: '8px', fontSize: '0.76rem' }}>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(24, 24, 27, 0.7)',
          border: '1px solid #27272a',
          borderRadius: '12px',
          padding: '4px 10px',
          color: '#a1a1aa',
          fontSize: '0.72rem',
          cursor: 'pointer',
          outline: 'none',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#3f3f46';
          e.currentTarget.style.color = '#f4f4f5';
          e.currentTarget.style.background = 'rgba(39, 39, 42, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#27272a';
          e.currentTarget.style.color = '#a1a1aa';
          e.currentTarget.style.background = 'rgba(24, 24, 27, 0.7)';
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        <BookOpen size={12} color="#818cf8" />
        <span style={{ fontWeight: 500 }}>
          {sources.length} {sources.length === 1 ? 'source' : 'sources'} consulted
        </span>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
          {sources.map((src) => {
            const hasUrl = Boolean(src.url);
            return (
              <div
                key={src.index || src.id || src.url}
                role={hasUrl ? 'button' : undefined}
                tabIndex={hasUrl ? 0 : undefined}
                onClick={() => hasUrl && window.open(src.url, '_blank', 'noopener,noreferrer')}
                onKeyDown={(e) => hasUrl && (e.key === 'Enter' || e.key === ' ') && window.open(src.url, '_blank', 'noopener,noreferrer')}
                title={src.title || src.url}
                style={{
                  background: 'rgba(24, 24, 27, 0.9)',
                  border: '1px solid #27272a',
                  borderRadius: '8px',
                  padding: '4px 8px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  maxWidth: '280px',
                  cursor: hasUrl ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (hasUrl) {
                    e.currentTarget.style.borderColor = '#818cf8';
                    e.currentTarget.style.background = 'rgba(39, 39, 42, 0.7)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (hasUrl) {
                    e.currentTarget.style.borderColor = '#27272a';
                    e.currentTarget.style.background = 'rgba(24, 24, 27, 0.9)';
                  }
                }}
              >
                <span style={{
                  background: 'rgba(99, 102, 241, 0.2)',
                  border: '1px solid rgba(99, 102, 241, 0.4)',
                  color: '#c7d2fe',
                  width: '16px',
                  height: '16px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.62rem',
                  fontWeight: 700,
                  flexShrink: 0,
                }}>
                  {src.index}
                </span>
                {getSourceIcon(src.source_type)}
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.72rem', color: '#d4d4d8', fontWeight: 500 }}>
                  {src.title || getDisplayDomain(src.url) || 'Source'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
