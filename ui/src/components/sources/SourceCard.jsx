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
  const [onlineStatus, setOnlineStatus] = useState('checking');

  const textBody = source.content || source.snippet || '';
  const wordCount = textBody ? textBody.trim().split(/\s+/).length : 0;
  const readTimeMin = Math.max(1, Math.round(wordCount / 200));

  useEffect(() => {
    if (!source.url || !source.url.startsWith('http')) {
      setOnlineStatus('local');
      return;
    }
    pingSourceURL(source.url)
      .then(res => setOnlineStatus(res.online ? 'online' : 'offline'))
      .catch(() => setOnlineStatus('offline'));
  }, [source.url]);

  const domain = (() => {
    try { return source.url ? new URL(source.url).hostname.replace('www.', '') : ''; } catch { return ''; }
  })();

  const renderIcon = () => {
    if (domain && !iconFailed) {
      return (
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
          alt=""
          className="source-card-favicon"
          onError={() => setIconFailed(true)}
        />
      );
    }
    if (source.type === 'pdf' || source.type === 'file') return <FileText size={13} className="text-zinc-400 shrink-0" />;
    if (source.type === 'youtube' || source.url?.includes('youtube.com') || source.url?.includes('youtu.be')) {
      return <Video size={13} className="text-zinc-400 shrink-0" />;
    }
    return <Globe size={13} className="text-zinc-400 shrink-0" />;
  };

  const healthColor = onlineStatus === 'online' ? '#10b981' : onlineStatus === 'offline' ? '#f43f5e' : '#f59e0b';
  const healthTitle = onlineStatus === 'online' ? 'Online' : onlineStatus === 'offline' ? 'Offline' : 'Checking Health...';

  return (
    <div
      className={`source-card-tasteful ${isActive ? 'active' : ''} ${isIndexing ? 'indexing' : ''}`}
      onClick={(e) => !isIndexing && onClick?.(e)}
      onDoubleClick={(e) => !isIndexing && onDoubleClick?.(e)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && !isIndexing && onClick) {
          e.preventDefault();
          onClick(e);
        }
      }}
    >
      <div className="source-card-top-row">
        {onToggleScope && (
          <input
            type="checkbox"
            checked={isScoped}
            onChange={(e) => {
              e.stopPropagation();
              onToggleScope(source.id || String(source.index));
            }}
            onClick={(e) => e.stopPropagation()}
            className="source-scope-input"
            title={isScoped ? 'In chat context' : 'Excluded from chat'}
            aria-label={`Scope source ${source.title || 'Untitled'}`}
          />
        )}

        {source.index && <span className="source-index-badge">[{source.index}]</span>}

        {onlineStatus !== 'local' && (
          <span className="source-health-dot" style={{ backgroundColor: healthColor }} title={healthTitle} />
        )}

        <span className={`source-title-text ${isScoped ? '' : 'unscoped'}`}>
          {source.title || 'Untitled Source'}
        </span>

        {isIndexing ? (
          <div className="source-indexing-badge">
            <Loader2 size={11} className="spin text-amber-400" />
            <span>Indexing...</span>
          </div>
        ) : (
          <div className="source-card-actions">
            {onInspect && (
              <button
                type="button"
                className="source-action-btn"
                onClick={(e) => { e.stopPropagation(); onInspect(source); }}
                title="Inspect source"
              >
                <Eye size={12} />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="source-action-btn delete"
                onClick={(e) => { e.stopPropagation(); onDelete(source.index); }}
                title="Remove source"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="source-card-bottom-row">
        <div className="source-domain-wrapper">
          {renderIcon()}
          <span className="source-domain-text">
            {source.url ? truncateUrl(source.url) : source.filename || 'Uploaded Document'}
          </span>
        </div>
        {wordCount > 0 && <span className="source-read-badge">{readTimeMin}m read</span>}
      </div>
    </div>
  );
}
