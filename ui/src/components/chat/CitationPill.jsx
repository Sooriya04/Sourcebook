import React, { useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';

export default function CitationPill({ index, source, isActive, onClick }) {
  const [hovered, setHovered] = useState(false);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

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
      >
        [{index}]
      </button>

      {hovered && source && (
        <span className="citation-hover-card">
          <span className="hover-card-header">
            <FileText size={12} className="hover-card-icon" />
            <span className="hover-card-title">{source.title}</span>
          </span>
          <span className="hover-card-body">
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
                color: '#818cf8', 
                transition: 'color 0.15s ease' 
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#a5b4fc'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#818cf8'}
            >
              <ExternalLink size={10} />
              <span className="hover-card-url" style={{ textDecoration: 'underline' }}>{source.url}</span>
            </a>
          )}
        </span>
      )}
    </span>
  );
}
