import React, { useState } from 'react';
import { Globe, FileText, Video, Trash2, Loader2 } from 'lucide-react';
import { truncateUrl } from '../../utils/formatters';

export default function SourceCard({ source, isActive, onClick, onDelete }) {
  const [iconFailed, setIconFailed] = useState(false);
  const isIndexing = source.status === 'Indexing...';

  const getDomain = (urlStr) => {
    try {
      if (!urlStr) return '';
      return new URL(urlStr).hostname;
    } catch {
      return '';
    }
  };

  const domain = getDomain(source.url);

  const renderIcon = () => {
    if (domain && !iconFailed) {
      return (
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
          alt=""
          style={{ width: 14, height: 14, borderRadius: 2, flexShrink: 0, objectFit: 'contain' }}
          onError={() => setIconFailed(true)}
        />
      );
    }
    if (source.type === 'pdf' || source.type === 'file') {
      return <FileText size={14} color="var(--text-main)" />;
    }
    if (source.type === 'youtube') {
      return <Video size={14} color="#ef4444" />;
    }
    return <Globe size={14} color="var(--text-main)" />;
  };

  const handleCardClick = (e) => {
    if (isIndexing) return;
    if (onClick) onClick(e);
  };

  return (
    <div
      className={`source-card ${isActive ? 'active' : ''} ${isIndexing ? 'indexing' : ''}`}
      onClick={handleCardClick}
      style={{ cursor: isIndexing ? 'wait' : 'pointer', opacity: isIndexing ? 0.7 : 1 }}
    >
      <div className="source-card-header">
        <span className="source-index">[{source.index || '1'}]</span>
        <span className="source-title">{source.title || 'Untitled Source'}</span>
        {isIndexing ? (
          <div className="source-status-badge">
            <Loader2 size={12} className="spin" color="var(--amber)" />
            <span>Indexing...</span>
          </div>
        ) : (
          onDelete && (
            <button
              className="source-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(source.index);
              }}
              title="Remove source"
            >
              <Trash2 size={12} />
            </button>
          )
        )}
      </div>

      <div className="source-url">
        {renderIcon()}
        <span style={{ marginLeft: '4px' }}>
          {source.url ? truncateUrl(source.url) : source.filename || 'Uploaded Document'}
        </span>
      </div>
    </div>
  );
}
