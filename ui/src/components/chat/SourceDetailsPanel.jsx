import React, { useState } from 'react';
import { BookOpen, Globe, PlayCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function SourceDetailsPanel({ sources = [], contextMode = '' }) {
  const [expanded, setExpanded] = useState(false);
  if (!sources || sources.length === 0) return null;

  const getSourceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'youtube':
        return <PlayCircle size={12} color="#ef4444" />;
      case 'arxiv':
        return <FileText size={12} color="#10b981" />;
      case 'notebook':
        return <BookOpen size={12} color="var(--accent-primary)" />;
      default:
        return <Globe size={12} color="#3b82f6" />;
    }
  };

  const getDisplayDomain = (url) => {
    try {
      if (!url) return '';
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url || '';
    }
  };

  return (
    <div style={{ marginTop: '6px', fontSize: '0.76rem' }}>
      <button 
        type="button"
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          background: 'var(--canvas-2)',
          border: '1px solid var(--border-color)',
          borderRadius: '14px',
          padding: '3px 10px',
          color: 'var(--text-muted)',
          fontSize: '0.72rem',
          cursor: 'pointer',
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--canvas-2)'; }}
      >
        <BookOpen size={11} color="var(--accent-primary)" />
        <span style={{ fontWeight: 500 }}>
          {sources.length} {sources.length === 1 ? 'source' : 'sources'} consulted
        </span>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>

      {expanded && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px',
          marginTop: '8px',
          padding: '2px 0'
        }}>
          {sources.map((src) => (
            <div 
              key={src.index} 
              style={{
                background: 'var(--canvas-2)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '4px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                maxWidth: '260px',
                cursor: src.url ? 'pointer' : 'default',
                transition: 'border-color 0.15s ease'
              }}
              onClick={() => src.url && window.open(src.url, '_blank', 'noopener,noreferrer')}
              title={src.title || src.url}
              onMouseEnter={(e) => { if (src.url) e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
              onMouseLeave={(e) => { if (src.url) e.currentTarget.style.borderColor = 'var(--border-color)'; }}
            >
              <span style={{
                background: 'var(--accent-primary)',
                color: 'var(--canvas)',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.62rem',
                fontWeight: 700,
                flexShrink: 0
              }}>
                {src.index}
              </span>
              {getSourceIcon(src.source_type)}
              <span style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                fontSize: '0.72rem',
                color: 'var(--text-main)',
                fontWeight: 500
              }}>
                {src.title || getDisplayDomain(src.url) || 'Source'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
