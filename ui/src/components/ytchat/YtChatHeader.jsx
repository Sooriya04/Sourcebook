import React from 'react';
import { ArrowLeft, ExternalLink, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function YtChatHeader({
  title,
  channel,
  duration,
  videoId,
  syncStatus,
  onRefreshSync
}) {
  const navigate = useNavigate();

  const isSynced = syncStatus === 'synced';
  const isSyncing = syncStatus === 'syncing';
  const statusColor = isSynced ? '#10b981' : isSyncing ? '#f59e0b' : '#ef4444';
  const statusText = isSynced ? 'Transcript Synced' : isSyncing ? 'Fetching Transcript...' : 'Transcript Offline';

  return (
    <header className="ytc-header">
      <div className="ytc-header-left">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="ytc-back-btn"
          title="Back to Notebooks"
        >
          <ArrowLeft size={14} />
          <span>Notebooks</span>
        </button>

        <div className="ytc-header-sep" />

        <div className="ytc-header-meta">
          <h1 className="ytc-header-title" title={title}>{title}</h1>
          <div className="ytc-header-sub">
            <span className="ytc-channel">{channel || 'YouTube Video'}</span>
            {duration && (
              <>
                <span className="ytc-dot">•</span>
                <span className="ytc-duration">{duration}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="ytc-header-right">
        {/* Sync Status Pill Indicator */}
        <div
          className="ytc-sync-pill"
          title={isSynced ? 'Transcript completely indexed and synced' : 'Transcript sync status'}
          onClick={onRefreshSync}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: statusColor,
              flexShrink: 0
            }}
            className={isSynced ? 'shadow-[0_0_8px_rgba(16,185,129,0.6)]' : ''}
          />
          <span className="ytc-sync-label">{statusText}</span>
          <button
            type="button"
            className="ytc-sync-refresh-btn"
            onClick={(e) => {
              e.stopPropagation();
              onRefreshSync?.();
            }}
            title="Re-check transcript"
          >
            <RefreshCw size={11} className={isSyncing ? 'animate-spin' : ''} />
          </button>
        </div>

        {videoId && (
          <a
            href={`https://www.youtube.com/watch?v=${videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ytc-external-link"
            title="Open on YouTube"
          >
            <span>Watch on YouTube</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </header>
  );
}
