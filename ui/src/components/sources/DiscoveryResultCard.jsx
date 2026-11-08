import React, { useState } from 'react';
import { ExternalLink, Globe, Video } from 'lucide-react';

export default function DiscoveryResultCard({ result, isSelected, onToggle, isYouTube }) {
  const [iconFailed, setIconFailed] = useState(false);
  const isYT = isYouTube(result.url, result.source);

  const domain = (() => {
    try { return result.url ? new URL(result.url).hostname.replace('www.', '') : ''; } catch { return ''; }
  })();

  const renderIcon = () => {
    if (domain && !iconFailed && !isYT) {
      return (
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
          alt=""
          style={{ width: '14px', height: '14px', borderRadius: '3px' }}
          onError={() => setIconFailed(true)}
        />
      );
    }
    if (isYT) return <Video size={13} style={{ color: '#f87171' }} />;
    return <Globe size={13} style={{ color: '#9aa0a6' }} />;
  };

  return (
    <div
      className={`discovery-result-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onToggle(result.url)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle(result.url);
        }
      }}
    >
      <div className="discovery-card-avatar">
        {renderIcon()}
      </div>

      <div className="discovery-card-details">
        <div className="discovery-card-title-row">
          <span className="discovery-card-title">
            {result.title || 'Untitled Source'}
          </span>
          <ExternalLink size={11} className="discovery-card-ext-icon" />
        </div>
        {result.snippet && (
          <div className="discovery-card-snippet">
            {result.snippet}
          </div>
        )}
      </div>

      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggle(result.url)}
          onClick={(e) => e.stopPropagation()}
          className="source-scope-input"
          aria-label={`Select ${result.title || 'source'}`}
        />
      </div>
    </div>
  );
}
