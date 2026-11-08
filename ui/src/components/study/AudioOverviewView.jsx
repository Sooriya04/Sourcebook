import React, { useState, useEffect } from 'react';
import { getPodcastVoices, getPodcastEpisodes, streamPodcastGeneration } from '../../services/sourcebookApi';
import PodcastConfigBar from './PodcastConfigBar';
import PodcastPlayerCard from './PodcastPlayerCard';
import PodcastEpisodeList from './PodcastEpisodeList';
import OverviewStudioDetail from './OverviewStudioDetail';

export default function AudioOverviewView({ 
  notebookId, 
  sources = [],
  audioPlayer,
  parentEpisodes,
  onEpisodesChange
}) {
  const [loading, setLoading] = useState(false);
  const [statusInfo, setStatusInfo] = useState(null);
  const [error, setError] = useState(null);
  const [turns, setTurns] = useState([]);
  const [summary, setSummary] = useState('');
  const [takeaways, setTakeaways] = useState([]);
  const [episodes, setEpisodes] = useState(() => parentEpisodes || []);
  useEffect(() => {
    if (parentEpisodes) setEpisodes(parentEpisodes);
  }, [parentEpisodes]);
  const [activeEpId, setActiveEpId] = useState('');
  const [voices, setVoices] = useState([]);
  const [options, setOptions] = useState({
    length: 'deep',
    format: 'banter',
    voice_host1: 'am_michael',
    voice_host2: 'af_sarah',
    focus_source: ''
  });

  useEffect(() => {
    if (parentEpisodes && parentEpisodes.length > 0) {
      setEpisodes(parentEpisodes);
      if (!activeEpId) applyEpisode(parentEpisodes[0]);
    }
  }, [parentEpisodes]);

  useEffect(() => {
    if (!notebookId) return;
    if (!parentEpisodes || parentEpisodes.length === 0) {
      getPodcastEpisodes(notebookId).then((list) => {
        if (list && list.length > 0) {
          setEpisodes(list);
          onEpisodesChange?.(list);
          applyEpisode(list[0]);
        }
      });
    }
    getPodcastVoices().then(setVoices);
  }, [notebookId]);

  const applyEpisode = (ep) => {
    if (!ep) return;
    setActiveEpId(ep.id);
    if (ep.turns) setTurns(ep.turns);
    if (ep.summary) setSummary(ep.summary);
    if (ep.takeaways) setTakeaways(ep.takeaways);
    setStatusInfo(null);
    setLoading(false);
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
    const updated = [newEp, ...episodes.filter((e) => e.id !== epId)];
    setEpisodes(updated);
    onEpisodesChange?.(updated);
    applyEpisode(newEp);
    if (audioPlayer) audioPlayer.playEpisode(newEp);
  };

  const activeEp = episodes.find((e) => e.id === activeEpId) || episodes[0] || {};
  const isCurrentActive = audioPlayer?.currentEpisode?.id === activeEp.id;
  const isPlaying = isCurrentActive && audioPlayer.isPlaying;
  const currentTime = isCurrentActive ? audioPlayer.currentTime : 0;
  const duration = isCurrentActive && audioPlayer.duration ? audioPlayer.duration : (activeEp.duration || 0);

  const togglePlay = () => {
    if (activeEp.id) audioPlayer?.togglePlayEpisode(activeEp);
  };

  const handleSeek = (e) => {
    if (!duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioPlayer?.seek(percent * duration);
  };

  const handleSpeedChange = () => {
    const nextSpeed = (audioPlayer?.speed || 1.0) >= 2.0 ? 1.0 : (audioPlayer?.speed || 1.0) + 0.25;
    audioPlayer?.setPlaybackSpeed(nextSpeed);
  };

  const jumpToTime = (timestamp) => {
    if (activeEp.id) {
      audioPlayer?.playEpisode(activeEp);
      audioPlayer?.seek(timestamp);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor((secs || 0) / 60);
    const s = Math.floor((secs || 0) % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="audio-overview-view" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <PodcastConfigBar options={options} setOptions={setOptions} voices={voices} sources={sources} disabled={loading} />

      <PodcastPlayerCard
        notebookId={notebookId}
        audioUrl={activeEp.audio_url || `/api/sourcebook/v1/study/audio/${notebookId}`}
        duration={duration}
        currentTime={currentTime}
        isPlaying={isPlaying}
        speed={audioPlayer?.speed || 1.0}
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

      <OverviewStudioDetail summary={summary} takeaways={takeaways} turns={turns} sources={sources} onJumpToTime={jumpToTime} formatTime={formatTime} />
    </div>
  );
}
