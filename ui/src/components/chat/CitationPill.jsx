import React, { useState } from 'react';
import { ExternalLink, FileText } from 'lucide-react';

export default function CitationPill({ index, source, isActive, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <span 
      className="citation-pill-container"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      <button
        className={`citation-pill ${isActive ? 'active' : ''}`}
        onClick={onClick}
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
          <span className="hover-card-footer">
            <ExternalLink size={10} />
            <span className="hover-card-url">{source.url}</span>
          </span>
        </span>
      )}
    </span>
  );
}
