import React, { useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';

export default function CitationPill({ index, source, isActive, onClick }) {
  const [hovered, setHovered] = useState(false);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  const getFaviconUrl = (urlStr) => {
    if (!urlStr) return null;
    try {
      const hostname = new URL(urlStr).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
    } catch (e) {
      return null;
    }
  };

  const favicon = source?.url ? getFaviconUrl(source.url) : null;

  return (
    <span 
      className="citation-pill-container"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        className={`citation-pill ${isActive ? 'active' : ''}`}
        onClick={handleClick}
        title={source ? source.title : `Source [${index}]`}
        style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: '600',
          transition: 'transform 0.1s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease',
        }}
        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        [{index}]
      </button>

      {hovered && source && (
        <span className="citation-hover-card glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px' }}>
          <span className="hover-card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {favicon ? (
              <img 
                src={favicon} 
                alt="" 
                style={{ width: '14px', height: '14px', borderRadius: '3px' }} 
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <FileText size={14} className="hover-card-icon" />
            )}
            <span className="hover-card-title" style={{ fontSize: '0.8rem', fontWeight: '600', color: 'var(--text-main)' }}>
              {source.title}
            </span>
          </span>
          
          <span className="hover-card-body" style={{ fontSize: '0.74rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            {source.snippet || source.content?.slice(0, 160) || "No preview available."}...
          </span>
          
          {source.url && (
            <a 
              href={source.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover-card-footer"
              style={{ 
                textDecoration: 'none', 
                color: 'var(--accent-primary)', 
                transition: 'color 0.15s ease',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.7rem'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.color = 'var(--accent-primary)'}
            >
              <ExternalLink size={10} />
              <span className="hover-card-url" style={{ textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                {source.url}
              </span>
            </a>
          )}
        </span>
      )}
    </span>
  );
}
