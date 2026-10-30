import React from 'react';
import { Play, Pause } from 'lucide-react';

export default function StudioAudioItem({
  episode,
  notebookTitle = '',
  sourcesCount = 0,
  isCurrentPlaying = false,
  isPlaying = false,
  currentTime = 0,
  duration = 0,
  onTogglePlay,
  onOpenOverview
}) {
  const formatTime = (secs) => {
    if (!secs || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const getFormatLabel = (fmt, len) => {
    if (fmt === 'banter' || fmt === 'dialogue') return 'Deep Dive';
    if (fmt === 'quick') return 'Summary';
    if (fmt === 'critique') return 'Debate';
    if (fmt) return fmt.charAt(0).toUpperCase() + fmt.slice(1);
    return len === 'deep' ? 'Deep Dive' : 'Podcast';
  };

  const getCleanTitle = () => {
    if (episode.title) return episode.title;
    if (episode.summary) {
      const firstSentence = episode.summary.split('.')[0]
        .replace(/^(this episode explores|austin and taylor explore|welcome back! today we are exploring|we are digging into)\s*/i, '')
        .trim();
      if (firstSentence.length > 5) {
        return firstSentence.length > 38 ? `${firstSentence.slice(0, 36)}...` : firstSentence;
      }
    }
    return notebookTitle ? `${notebookTitle} Overview` : 'Audio Overview';
  };

  const title = getCleanTitle();
  const durStr = formatTime(episode.duration || duration);
  const styleLabel = getFormatLabel(episode.format, episode.length);
  const sCount = episode.sources_count || episode.sourcesCount || sourcesCount || 0;
  const progressPercent = isCurrentPlaying && duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      onClick={() => onOpenOverview?.(episode)}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '8px 10px',
        borderRadius: '10px',
        backgroundColor: isCurrentPlaying ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease',
        overflow: 'hidden'
      }}
      onMouseEnter={(e) => {
        if (!isCurrentPlaying) {
          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isCurrentPlaying) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
        {/* Left: Wave Icon with Sparkle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0, color: '#8ab4f8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '14px' }}>
            <span style={{ width: '2px', height: isCurrentPlaying && isPlaying ? '12px' : '6px', backgroundColor: '#8ab4f8', borderRadius: '1px', transition: 'height 0.2s' }} />
            <span style={{ width: '2px', height: isCurrentPlaying && isPlaying ? '14px' : '11px', backgroundColor: '#8ab4f8', borderRadius: '1px', transition: 'height 0.2s' }} />
            <span style={{ width: '2px', height: isCurrentPlaying && isPlaying ? '8px' : '5px', backgroundColor: '#8ab4f8', borderRadius: '1px', transition: 'height 0.2s' }} />
          </div>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#8ab4f8" style={{ marginTop: '-4px', marginLeft: '-1px' }}>
            <path d="M12 2l2.4 6.8L21 12l-6.6 3.2L12 22l-2.4-6.8L3 12l6.6-3.2z" />
          </svg>
        </div>

        {/* Center: Dynamic Title & Subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#f4f4f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={title}>
            {title}
          </div>
          <div style={{ fontSize: '0.71rem', color: '#9aa0a6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {durStr} • {styleLabel} • {sCount} sources
          </div>
        </div>

        {/* Right: Sleek Play/Pause Icon & Blue Dot */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePlay?.(episode);
            }}
            title={isCurrentPlaying && isPlaying ? 'Pause Audio' : 'Play Audio Overview'}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#c4c7c5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              transition: 'color 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#c4c7c5'; }}
          >
            {isCurrentPlaying && isPlaying ? (
              <Pause size={14} fill="currentColor" />
            ) : (
              <Play size={14} fill="currentColor" style={{ marginLeft: '1px' }} />
            )}
          </button>

          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#1a73e8',
              flexShrink: 0
            }}
            title="Audio Ready"
          />
        </div>
      </div>

      {/* Progress Bar when Active */}
      {isCurrentPlaying && (
        <div style={{ width: '100%', height: '2px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '1px', marginTop: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#8ab4f8', transition: 'width 0.2s linear' }} />
        </div>
      )}
    </div>
  );
}
