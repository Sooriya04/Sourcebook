import React from 'react';
import { Play, Pause, Radio, RefreshCw, Download, Sparkles } from 'lucide-react';
import PodcastProgressTracker from './PodcastProgressTracker';

export default function PodcastPlayerCard({
  notebookId,
  audioUrl,
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
  onGenerate,
  formatTime
}) {
  return (
    <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', padding: '18px 20px', borderRadius: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Radio size={20} color="#818cf8" />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 600, color: '#f4f4f5' }}>Audio Overview (Deep Dive)</h4>
              <span style={{ fontSize: '0.62rem', background: '#27272a', color: '#a1a1aa', padding: '2px 6px', borderRadius: '4px', fontFamily: "'IBM Plex Mono', monospace" }}>KOKORO 82M</span>
            </div>
            <p style={{ margin: '2px 0 0 0', fontSize: '0.73rem', color: '#71717a' }}>Austin & Taylor analyze your notebook materials</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {duration > 0 && (
            <a href={audioUrl} download={`podcast-${notebookId}.wav`} title="Download Audio Track (.wav)" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 10px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#d4d4d8', fontSize: '0.74rem', textDecoration: 'none' }}>
              <Download size={13} />
            </a>
          )}
          <button type="button" onClick={onGenerate} disabled={loading || sources.length === 0} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', backgroundColor: '#4f46e5', border: '1px solid #6366f1', borderRadius: '6px', color: '#ffffff', fontSize: '0.76rem', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}>
            {loading ? <RefreshCw size={13} className="spin-icon" /> : <Sparkles size={13} />}
            <span>{loading ? 'Synthesizing...' : duration > 0 ? 'Generate New Episode' : 'Generate Overview'}</span>
          </button>
        </div>
      </div>

      {statusInfo && <PodcastProgressTracker statusInfo={statusInfo} />}
      {error && <div style={{ fontSize: '0.76rem', color: '#fca5a5', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '6px', marginBottom: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button type="button" onClick={onTogglePlay} disabled={!duration} style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: duration ? '#f4f4f5' : '#27272a', border: 'none', color: '#09090b', cursor: duration ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {isPlaying ? <Pause size={17} /> : <Play size={17} style={{ marginLeft: '2px' }} />}
        </button>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div onClick={onSeek} style={{ height: '6px', backgroundColor: '#27272a', borderRadius: '3px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            <div style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%`, height: '100%', backgroundColor: '#6366f1', borderRadius: '3px', transition: 'width 0.1s linear' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#71717a', fontFamily: "'IBM Plex Mono', monospace" }}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <button type="button" onClick={onSpeedChange} style={{ padding: '4px 8px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#d4d4d8', fontSize: '0.72rem', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, cursor: 'pointer' }}>
          {speed.toFixed(2)}x
        </button>
      </div>
    </div>
  );
}
