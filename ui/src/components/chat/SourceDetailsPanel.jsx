import React, { useState } from 'react';
import { BookOpen, Globe, PlayCircle, FileText, ChevronDown, ChevronUp } from 'lucide-react';

export default function SourceDetailsPanel({ sources = [], contextMode = '' }) {
  const [expanded, setExpanded] = useState(false);
  if (!sources || sources.length === 0) return null;

  const getSourceIcon = (type) => {
    switch (type?.toLowerCase()) {
      case 'youtube':
        return <PlayCircle size={14} color="#ef4444" />;
      case 'arxiv':
        return <FileText size={14} color="#10b981" />;
      case 'notebook':
        return <BookOpen size={14} color="var(--accent-primary)" />;
      default:
        return <Globe size={14} color="#3b82f6" />;
    }
  };

  const getDisplayDomain = (url) => {
    try {
      if (!url) return '';
      const parsed = new URL(url);
      return parsed.hostname.replace('www.', '');
    } catch {
      return url || '';
    }
  };

  return (
    <div className="source-details-panel" style={{
      marginTop: '12px',
      borderTop: '1px solid var(--border-color)',
      paddingTop: '8px',
      fontSize: '0.8rem',
      color: 'var(--text-muted)'
    }}>
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none',
          padding: '4px 0'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ 
            background: 'rgba(255,255,255,0.06)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 500,
            border: '1px solid var(--border-color)'
          }}>
            {contextMode || 'Sources'}
          </span>
          <span>Used {sources.length} {sources.length === 1 ? 'source' : 'sources'}</span>
        </div>
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </div>

      {expanded && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '8px',
          marginTop: '10px',
          maxHeight: '240px',
          overflowY: 'auto',
          paddingBottom: '4px'
        }}>
          {sources.map((src) => (
            <div 
              key={src.index} 
              style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '8px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                transition: 'background 0.2s ease',
                cursor: src.url ? 'pointer' : 'default'
              }}
              onClick={() => src.url && window.open(src.url, '_blank', 'noopener,noreferrer')}
              onMouseEnter={(e) => {
                if (src.url) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              }}
              onMouseLeave={(e) => {
                if (src.url) e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
              }}
            >
              <div style={{
                background: 'rgba(255, 255, 255, 0.06)',
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 600,
                flexShrink: 0
              }}>
                {src.index}
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{
                  fontWeight: 500,
                  color: 'var(--text-main)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: '0.78rem'
                }}>
                  {src.title}
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginTop: '2px',
                  fontSize: '0.7rem',
                  color: 'var(--text-dim)'
                }}>
                  {getSourceIcon(src.source_type)}
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {src.source_type === 'Notebook' ? 'Local Note' : getDisplayDomain(src.url)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
