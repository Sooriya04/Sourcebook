import React, { useState, useEffect } from 'react';
import { Globe, FileText, Video, Trash2, Loader2, Eye } from 'lucide-react';
import { truncateUrl } from '../../utils/formatters';
import { pingSourceURL } from '../../services/sourcebookApi';

export default function SourceCard({ 
  source, 
  isActive, 
  isScoped = true,
  onToggleScope,
  onClick, 
  onDoubleClick, 
  onInspect, 
  onDelete 
}) {
  const [iconFailed, setIconFailed] = useState(false);
  const isIndexing = source.status === 'Indexing...';
  const [onlineStatus, setOnlineStatus] = useState('checking'); // 'checking', 'online', 'offline', 'local'

  // Approximate metrics (word count & read time)
  const textBody = source.content || source.snippet || '';
  const wordCount = textBody ? textBody.trim().split(/\s+/).length : 0;
  const readTimeMin = Math.max(1, Math.round(wordCount / 200));

  useEffect(() => {
    if (!source.url || !source.url.startsWith('http')) {
      setOnlineStatus('local');
      return;
    }
    pingSourceURL(source.url)
      .then(res => {
        setOnlineStatus(res.online ? 'online' : 'offline');
      })
      .catch(() => {
        setOnlineStatus('offline');
      });
  }, [source.url]);

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

  const handleCardDoubleClick = (e) => {
    if (isIndexing) return;
    if (onDoubleClick) onDoubleClick(e);
  };

  return (
    <div
      className={`source-card ${isActive ? 'active' : ''} ${isIndexing ? 'indexing' : ''}`}
      onClick={handleCardClick}
      onDoubleClick={handleCardDoubleClick}
      style={{ cursor: isIndexing ? 'wait' : 'pointer', opacity: isIndexing ? 0.7 : 1 }}
    >
      <div className="source-card-header" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        {onToggleScope && (
          <input
            type="checkbox"
            checked={isScoped}
            onChange={(e) => {
              e.stopPropagation();
              onToggleScope(source.id || String(source.index));
            }}
            onClick={(e) => e.stopPropagation()}
            className="source-scope-checkbox"
            title={isScoped ? "Included in chat context (Click to exclude)" : "Excluded from chat context (Click to include)"}
            style={{
              cursor: 'pointer',
              accentColor: 'var(--accent-primary)',
              margin: '0 2px 0 0',
              width: '13px',
              height: '13px',
              flexShrink: 0
            }}
          />
        )}
        {source.index && <span className="source-index">[{source.index}]</span>}
        {onlineStatus !== 'local' && (
          <span
            className={`health-dot ${onlineStatus}`}
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: onlineStatus === 'online' ? '#10b981' : onlineStatus === 'offline' ? '#f43f5e' : '#f59e0b',
              display: 'inline-block',
              flexShrink: 0
            }}
            title={onlineStatus === 'online' ? 'Source Online' : onlineStatus === 'offline' ? 'Source Offline' : 'Checking Health...'}
          />
        )}
        <span className="source-title" style={{ flex: 1, opacity: isScoped ? 1 : 0.6 }}>{source.title || 'Untitled Source'}</span>
        {isIndexing ? (
          <div className="source-status-badge">
            <Loader2 size={12} className="spin" color="var(--amber)" />
            <span>Indexing...</span>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {onInspect && (
              <button
                className="source-inspect-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onInspect(source);
                }}
                title="Inspect source content"
              >
                <Eye size={12} />
              </button>
            )}
            {onDelete && (
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
            )}
          </div>
        )}
      </div>

      <div className="source-url" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0, flex: 1 }}>
          {renderIcon()}
          <span style={{ marginLeft: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {source.url ? truncateUrl(source.url) : source.filename || 'Uploaded Document'}
          </span>
        </div>
        {wordCount > 0 && (
          <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginLeft: '6px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            {readTimeMin}m read
          </span>
        )}
      </div>
    </div>
  );
}
