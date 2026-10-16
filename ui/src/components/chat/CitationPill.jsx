import React, { useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';

export default function CitationPill({ index, source, isActive, onClick }) {
  const [hovered, setHovered] = useState(false);

  const getFaviconUrl = (urlStr) => {
    try {
      return urlStr ? `https://www.google.com/s2/favicons?domain=${new URL(urlStr).hostname}&sz=32` : null;
    } catch {
      return null;
    }
  };

  const favicon = source?.url ? getFaviconUrl(source.url) : null;
  const previewText = source?.snippet || source?.content?.slice(0, 160) || 'No preview available.';

  return (
    <span
      className="citation-pill-container"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', display: 'inline-block', verticalAlign: 'baseline' }}
    >
      <button
        type="button"
        className={`citation-pill ${isActive ? 'active' : ''}`}
        onClick={onClick}
        title={source?.title ? `${source.title} [${index}]` : `Source [${index}]`}
        style={{
          fontFamily: "'IBM Plex Mono', ui-monospace, monospace", fontWeight: 600, fontSize: '0.72rem',
          padding: '1px 6px', margin: '0 2px', borderRadius: '5px',
          border: isActive ? '1px solid #818cf8' : '1px solid rgba(99, 102, 241, 0.3)',
          background: isActive ? '#4f46e5' : 'rgba(99, 102, 241, 0.1)',
          color: isActive ? '#ffffff' : '#a5b4fc', cursor: 'pointer', lineHeight: '1.4',
          display: 'inline-flex', alignItems: 'center', transition: 'all 0.12s ease', outline: 'none'
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.92)'; }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
      >
        [{index}]
      </button>

      {hovered && source && (
        <div
          role="tooltip"
          style={{
            position: 'absolute', bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)',
            width: '280px', background: 'rgba(24, 24, 27, 0.97)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(63, 63, 70, 0.8)', borderRadius: '10px', padding: '10px 12px',
            zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '6px', textAlign: 'left'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {favicon ? (
              <img src={favicon} alt="" style={{ width: '14px', height: '14px', borderRadius: '3px', flexShrink: 0 }} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
            ) : (
              <FileText size={14} color="#818cf8" style={{ flexShrink: 0 }} />
            )}
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f4f4f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {source.title || 'Referenced Source'}
            </span>
          </div>

          <p style={{ fontSize: '0.73rem', color: '#d4d4d8', lineHeight: '1.45', margin: 0, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {previewText}
          </p>

          {source.url && (
            <a
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: '#818cf8', textDecoration: 'none', paddingTop: '4px', borderTop: '1px solid rgba(39, 39, 42, 0.9)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#a5b4fc'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#818cf8'; }}
            >
              <ExternalLink size={11} style={{ flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{source.url}</span>
            </a>
          )}
        </div>
      )}
    </span>
  );
}
