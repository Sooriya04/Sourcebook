import React from 'react';
import { Play, Pause, Headphones, RotateCcw, Download } from 'lucide-react';
import PodcastProgressTracker from './PodcastProgressTracker';

export default function PodcastPlayerCard({
  notebookId,
  audioUrl,
  episodeTitle = 'Audio Overview',
  episodeSubtitle = 'Two-host synthesis',
  duration,
  currentTime,
  isPlaying,
  speed,
  loading,
  sources = [],
  statusInfo,
  error,
  onTogglePlay,
  onSeek,
  onSpeedChange,
  onOpenGenerate,
  onRetry,
  formatTime
}) {
  return (
    <div className="audio-player-panel">
      <div className="audio-player-header">
        <div className="audio-player-identity">
          <span className="audio-player-icon">
            <Headphones size={16} />
          </span>
          <div className="audio-player-titles">
            <h3 className="audio-player-title">{episodeTitle}</h3>
            <p className="audio-player-subtitle">{episodeSubtitle}</p>
          </div>
        </div>

        <div className="audio-player-header-actions">
          {duration > 0 && (
            <a
              href={audioUrl}
              download={`audio-overview-${notebookId}.wav`}
              title="Download audio (.wav)"
              aria-label="Download audio"
              className="audio-player-icon-btn"
            >
              <Download size={14} />
            </a>
          )}

          <button
            type="button"
            onClick={onOpenGenerate}
            disabled={loading || sources.length === 0}
            title="Regenerate or create new Audio Overview"
            className="audio-player-regen-btn"
          >
            <RotateCcw size={13} />
            <span>{duration > 0 ? 'Regenerate' : 'Create'}</span>
          </button>
        </div>
      </div>

      {statusInfo && <PodcastProgressTracker statusInfo={statusInfo} />}

      {error && (
        <div className="audio-error-banner" role="alert">
          <span>{error}</span>
          {onRetry && (
            <button type="button" onClick={onRetry} className="audio-retry-btn">
              Retry
            </button>
          )}
        </div>
      )}

      {duration > 0 && (
        <div className="audio-player-controls">
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="audio-play-btn"
          >
            {isPlaying ? <Pause size={15} /> : <Play size={15} style={{ marginLeft: '2px' }} />}
          </button>

          <div className="audio-seek-group">
            <div
              onClick={onSeek}
              role="slider"
              aria-label="Audio seek bar"
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              aria-valuenow={Math.round(currentTime)}
              tabIndex={0}
              className="audio-seek-track"
            >
              <div
                className="audio-seek-fill"
                style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
              />
            </div>
            <div className="audio-time-row">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onSpeedChange}
            title="Playback speed"
            className="audio-speed-btn"
          >
            {speed.toFixed(2)}x
          </button>
        </div>
      )}
    </div>
  );
}
