import React, { useState, useRef } from 'react';
import { Play, Pause, Radio, RefreshCw, Download, Sparkles } from 'lucide-react';
import { generatePodcast } from '../../services/sourcebookApi';
import PodcastTranscript from './PodcastTranscript';

export default function AudioOverviewView({ notebookId, sources = [] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(() => `/api/sourcebook/v1/study/audio/${notebookId}`);
  const [turns, setTurns] = useState([]);

  const audioRef = useRef(null);

  const handleGenerate = async () => {
    if (!notebookId || loading) return;
    setLoading(true);
    setError(null);
    try {
      const data = await generatePodcast(notebookId);
      if (data.audio_url) {
        setAudioUrl(`${data.audio_url}?t=${Date.now()}`);
        setDuration(data.duration || 0);
        setTurns(data.turns || []);
        setIsPlaying(false);
      }
    } catch (err) {
      setError(err.message || 'Failed to synthesize audio overview');
    } finally {
      setLoading(false);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      if (audioRef.current.duration && !duration) {
        setDuration(audioRef.current.duration);
      }
    }
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = percent * duration;
  };

  const handleSpeedChange = () => {
    const nextSpeed = speed >= 2.0 ? 1.0 : speed + 0.25;
    setSpeed(nextSpeed);
    if (audioRef.current) audioRef.current.playbackRate = nextSpeed;
  };

  const jumpToTurn = (startTime) => {
    if (audioRef.current) {
      audioRef.current.currentTime = startTime;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const activeTurnIdx = turns.findIndex(
    (t) => currentTime >= (t.start_time || 0) && currentTime < (t.end_time || 9999)
  );

  return (
    <div className="audio-overview-view" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />

      {/* Podcast Player Header */}
      <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', padding: '20px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Radio size={20} color="#818cf8" />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 600, color: '#f4f4f5' }}>Deep Dive Podcast</h4>
                <span style={{ fontSize: '0.62rem', background: '#27272a', color: '#a1a1aa', padding: '2px 6px', borderRadius: '4px', fontFamily: "'IBM Plex Mono', monospace" }}>KOKORO 82M</span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.74rem', color: '#71717a' }}>Austin & Taylor analyze your notebook materials</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {duration > 0 && (
              <a
                href={audioUrl}
                download={`podcast-${notebookId}.wav`}
                title="Download Audio (.wav)"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 10px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#d4d4d8', fontSize: '0.74rem', textDecoration: 'none' }}
              >
                <Download size={13} />
              </a>
            )}
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading || sources.length === 0}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 14px', backgroundColor: '#4f46e5', border: '1px solid #6366f1', borderRadius: '6px', color: '#ffffff', fontSize: '0.76rem', fontWeight: 500, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? <RefreshCw size={13} className="spin-icon" /> : <Sparkles size={13} />}
              <span>{loading ? 'Synthesizing Audio...' : duration > 0 ? 'Regenerate' : 'Generate Overview'}</span>
            </button>
          </div>
        </div>

        {error && <div style={{ fontSize: '0.76rem', color: '#fca5a5', backgroundColor: 'rgba(239, 68, 68, 0.1)', padding: '8px 12px', borderRadius: '6px', marginBottom: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

        {/* Player Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '8px' }}>
          <button
            type="button"
            onClick={togglePlay}
            disabled={!duration}
            style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: duration ? '#f4f4f5' : '#27272a', border: 'none', color: '#09090b', cursor: duration ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
          </button>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div onClick={handleSeek} style={{ height: '6px', backgroundColor: '#27272a', borderRadius: '3px', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
              <div style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%`, height: '100%', backgroundColor: '#6366f1', borderRadius: '3px', transition: 'width 0.1s linear' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: '#71717a', fontFamily: "'IBM Plex Mono', monospace" }}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSpeedChange}
            style={{ padding: '4px 8px', backgroundColor: '#27272a', border: '1px solid #3f3f46', borderRadius: '6px', color: '#d4d4d8', fontSize: '0.72rem', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, cursor: 'pointer' }}
          >
            {speed.toFixed(2)}x
          </button>
        </div>
      </div>

      {/* Synced Discussion Transcript */}
      <PodcastTranscript
        turns={turns}
        activeTurnIdx={activeTurnIdx}
        onJumpToTurn={jumpToTurn}
        formatTime={formatTime}
      />
    </div>
  );
}
