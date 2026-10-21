import React from 'react';
import { Layers, CheckCircle } from 'lucide-react';

export default function PodcastEpisodeList({
  episodes = [],
  activeEpisodeId = '',
  onSelectEpisode,
  formatTime
}) {
  if (!episodes || episodes.length === 0) return null;

  return (
    <div style={{ backgroundColor: '#141416', border: '1px solid #27272a', padding: '12px 14px', borderRadius: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Layers size={13} color="#818cf8" />
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#f4f4f5', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Episode Playlist ({episodes.length})
          </span>
        </div>
        <span style={{ fontSize: '0.64rem', color: '#71717a' }}>Newest First (LIFO)</span>
      </div>

      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {episodes.map((ep, idx) => {
          const isActive = ep.id === activeEpisodeId || (!activeEpisodeId && idx === 0);
          const epNum = episodes.length - idx;
          const durationStr = ep.duration ? formatTime(ep.duration) : '--:--';
          let label = 'Standard';
          if (ep.length === 'deep' || (ep.duration >= 180) || (ep.turns && ep.turns.length >= 8)) {
            label = 'Deep Dive';
          } else if (ep.length === 'short' || (ep.duration > 0 && ep.duration <= 75) || (ep.turns && ep.turns.length <= 4)) {
            label = 'Quick';
          }

          return (
            <button
              key={ep.id || idx}
              type="button"
              onClick={() => onSelectEpisode(ep)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: isActive ? 'rgba(99, 102, 241, 0.15)' : '#18181b',
                border: isActive ? '1px solid #6366f1' : '1px solid #27272a',
                color: isActive ? '#f4f4f5' : '#a1a1aa',
                cursor: 'pointer',
                fontSize: '0.72rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                flexShrink: 0
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = '#3f3f46';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.borderColor = '#27272a';
              }}
            >
              {isActive && <CheckCircle size={12} color="#818cf8" />}
              <span style={{ fontWeight: 600 }}>Episode {epNum}</span>
              <span style={{ color: '#71717a', fontSize: '0.66rem' }}>({label} • {durationStr})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
