import React, { useState } from 'react';
import { Globe, FileText, Video, Loader2 } from 'lucide-react';

export default function SourceCard({ 
  source, 
  isActive, 
  isScoped = true,
  onToggleScope,
  onClick, 
  onDoubleClick
}) {
  const [iconFailed, setIconFailed] = useState(false);
  const isIndexing = source.status === 'Indexing...';

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
    if (source.type === 'pdf' || source.type === 'file') return <FileText size={14} className="text-zinc-300 shrink-0" />;
    if (source.type === 'youtube' || source.url?.includes('youtube.com') || source.url?.includes('youtu.be')) {
      return <Video size={14} className="text-zinc-300 shrink-0" />;
    }
    return <Globe size={14} className="text-zinc-300 shrink-0" />;
  };

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
      <div className="source-card-left-group">
        <div className="source-card-avatar">
          {renderIcon()}
        </div>

        <span className={`source-title-text ${isScoped ? '' : 'unscoped'}`}>
          {source.title || 'Untitled Source'}
        </span>

        {isIndexing && (
          <div className="source-indexing-badge">
            <Loader2 size={11} className="spin text-amber-400" />
            <span>Indexing...</span>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
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
      </div>
    </div>
  );
}
