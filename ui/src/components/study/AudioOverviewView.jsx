import React, { useState, useRef, useEffect } from 'react';
import { getPodcastVoices, getPodcastEpisodes, streamPodcastGeneration } from '../../services/sourcebookApi';
import PodcastConfigBar from './PodcastConfigBar';
import PodcastPlayerCard from './PodcastPlayerCard';
import PodcastEpisodeList from './PodcastEpisodeList';
import NotebookLMAudioStudio from './NotebookLMAudioStudio';

export default function AudioOverviewView({ notebookId, sources = [] }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [statusInfo, setStatusInfo] = useState(null);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState(() => `/api/sourcebook/v1/study/audio/${notebookId}`);
  const [turns, setTurns] = useState([]);
  const [summary, setSummary] = useState('');
  const [takeaways, setTakeaways] = useState([]);
  const [episodes, setEpisodes] = useState([]);
  const [activeEpId, setActiveEpId] = useState('');
  const [voices, setVoices] = useState([]);
  const [options, setOptions] = useState({
    length: 'deep',
    format: 'banter',
    voice_host1: 'am_michael',
    voice_host2: 'af_sarah',
    focus_source: ''
  });

  const audioRef = useRef(null);

  useEffect(() => {
    if (!notebookId) return;
    getPodcastEpisodes(notebookId).then((list) => {
      if (list && list.length > 0) {
        setEpisodes(list);
        applyEpisode(list[0]);
      }
    });
    getPodcastVoices().then(setVoices);
  }, [notebookId]);

  const buildAudioUrl = (ep) => {
    if (!ep) return `/api/sourcebook/v1/study/audio/${notebookId}?t=${Date.now()}`;
    let base = ep.audio_url;
    if (!base) {
      base = ep.id ? `/api/sourcebook/v1/study/audio/${notebookId}?episode=${ep.id}` : `/api/sourcebook/v1/study/audio/${notebookId}`;
    }
    base = base.replace(/[?&]t=\d+/g, '');
    const joiner = base.includes('?') ? '&' : '?';
    return `${base}${joiner}t=${Date.now()}`;
  };

  const applyEpisode = (ep) => {
    if (!ep) return;
    setActiveEpId(ep.id);
    const freshUrl = buildAudioUrl(ep);
    setAudioUrl(freshUrl);
    setDuration(ep.duration || 0);
    if (ep.turns) setTurns(ep.turns);
    if (ep.summary) setSummary(ep.summary);
    if (ep.takeaways) setTakeaways(ep.takeaways);
    setStatusInfo(null);
    setLoading(false);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.src = freshUrl;
      audioRef.current.load();
      audioRef.current.currentTime = 0;
    }
  };

  const handleGenerate = async () => {
    if (!notebookId || loading) return;
    setLoading(true);
    setError(null);
    setStatusInfo({ step: 'drafting', message: 'Starting deep dive synthesis...' });

    await streamPodcastGeneration({
      notebookId,
      options: { ...options, force: 'true' },
      onStatus: (st) => setStatusInfo(st),
      onOverview: (ov) => {
        if (ov.summary) setSummary(ov.summary);
        if (ov.takeaways) setTakeaways(ov.takeaways);
      },
      onDialogue: (dTurns) => setTurns(dTurns),
      onProgress: (prog) => {
        if (prog.step === 'complete') handleComplete(prog);
        else setStatusInfo(prog);
      },
      onComplete: (data) => handleComplete(data),
      onError: (err) => {
        setError(err.message || 'Failed to synthesize audio overview');
        setStatusInfo(null);
        setLoading(false);
      }
    });
  };

  const handleComplete = (data) => {
    const epId = data.id || `ep_${Date.now()}`;
    const cleanUrl = data.audio_url || `/api/sourcebook/v1/study/audio/${notebookId}?episode=${epId}`;
    const newEp = {
      id: epId,
      notebook_id: notebookId,
      duration: data.duration || 0,
      summary: data.summary,
      takeaways: data.takeaways,
      turns: data.turns,
      length: data.length || options.length,
      format: data.format || options.format,
      audio_url: cleanUrl,
      created_at: data.created_at || new Date().toISOString()
    };
    // Prepend to front: newest first (LIFO)
    setEpisodes((prev) => [newEp, ...prev.filter((e) => e.id !== epId)]);
    applyEpisode(newEp);
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play().catch(() => {});
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

  const jumpToTime = (timestamp) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timestamp;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="audio-overview-view" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={() => audioRef.current && setCurrentTime(audioRef.current.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
      />

      <PodcastConfigBar options={options} setOptions={setOptions} voices={voices} sources={sources} disabled={loading} />

      <PodcastPlayerCard
        notebookId={notebookId}
        audioUrl={audioUrl}
        duration={duration}
        currentTime={currentTime}
        isPlaying={isPlaying}
        speed={speed}
        loading={loading}
        sources={sources}
        statusInfo={statusInfo}
        error={error}
        onTogglePlay={togglePlay}
        onSeek={handleSeek}
        onSpeedChange={handleSpeedChange}
        onGenerate={handleGenerate}
        formatTime={formatTime}
      />

      <PodcastEpisodeList episodes={episodes} activeEpisodeId={activeEpId} onSelectEpisode={applyEpisode} formatTime={formatTime} />

      <NotebookLMAudioStudio summary={summary} takeaways={takeaways} turns={turns} sources={sources} onJumpToTime={jumpToTime} formatTime={formatTime} />
    </div>
  );
}
