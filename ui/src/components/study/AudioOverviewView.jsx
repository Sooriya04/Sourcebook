import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Headphones, Plus } from 'lucide-react';
import { getPodcastEpisodes, streamPodcastGeneration } from '../../services/sourcebookApi';
import PodcastPlayerCard from './PodcastPlayerCard';
import PodcastEpisodeList from './PodcastEpisodeList';
import OverviewStudioDetail from './OverviewStudioDetail';

const DEFAULT_OPTIONS = {
  length: 'deep',
  format: 'banter',
  voice_host1: 'am_michael',
  voice_host2: 'af_sarah',
  focus_source: ''
};

export default function AudioOverviewView({
  notebookId,
  sources = [],
  audioPlayer,
  parentEpisodes,
  onEpisodesChange,
  onOpenDialog,
  pendingAudioGen = null,
  onClearPendingAudioGen
}) {
  const [loading, setLoading] = useState(false);
  const [statusInfo, setStatusInfo] = useState(null);
  const [error, setError] = useState(null);
  const [turns, setTurns] = useState([]);
  const [summary, setSummary] = useState('');
  const [takeaways, setTakeaways] = useState([]);
  const [episodes, setEpisodes] = useState(() => parentEpisodes || []);
  const [activeEpId, setActiveEpId] = useState('');
  const lastOptionsRef = useRef(DEFAULT_OPTIONS);

  const applyEpisode = useCallback((ep) => {
    if (!ep) return;
    setActiveEpId(ep.id);
    setTurns(ep.turns || []);
    setSummary(ep.summary || '');
    setTakeaways(ep.takeaways || []);
    setStatusInfo(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (parentEpisodes && parentEpisodes.length > 0) {
      setEpisodes(parentEpisodes);
      if (!activeEpId || !parentEpisodes.some((e) => e.id === activeEpId)) {
        applyEpisode(parentEpisodes[0]);
      }
    }
  }, [parentEpisodes, activeEpId, applyEpisode]);

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
  }, [notebookId, parentEpisodes, onEpisodesChange, applyEpisode]);

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
      length: data.length || lastOptionsRef.current.length,
      format: data.format || lastOptionsRef.current.format,
      audio_url: cleanUrl,
      created_at: data.created_at || new Date().toISOString()
    };
    const updated = [newEp, ...episodes.filter((e) => e.id !== epId)];
    setEpisodes(updated);
    onEpisodesChange?.(updated);
    applyEpisode(newEp);
    if (audioPlayer) audioPlayer.playEpisode(newEp);
  };

  const handleGenerate = async (overrideOptions) => {
    const genOpts = overrideOptions && overrideOptions.length ? overrideOptions : lastOptionsRef.current;
    if (!notebookId || loading || sources.length === 0) return;
    if (overrideOptions && overrideOptions.length) {
      const { _ts, ...cleanOpts } = overrideOptions;
      lastOptionsRef.current = cleanOpts;
    }
    setLoading(true);
    setError(null);
    setStatusInfo({ step: 'drafting', message: 'Drafting two-host dialogue from sources...' });

    await streamPodcastGeneration({
      notebookId,
      options: { ...genOpts, force: 'true' },
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

  const handleGenerateRef = useRef(null);
  handleGenerateRef.current = handleGenerate;

  useEffect(() => {
    if (!pendingAudioGen) return;
    onClearPendingAudioGen?.();
    handleGenerateRef.current?.(pendingAudioGen);
  }, [pendingAudioGen, onClearPendingAudioGen]);

  const activeEpIndex = episodes.findIndex((e) => e.id === activeEpId);
  const activeEp = (activeEpIndex >= 0 ? episodes[activeEpIndex] : episodes[0]) || {};
  const epNumber = activeEpIndex >= 0 ? episodes.length - activeEpIndex : episodes.length;
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

  const hasResult = episodes.length > 0 || loading || Boolean(error) || Boolean(statusInfo);

  const lengthLabel =
    activeEp.length === 'short' ? 'Quick' : activeEp.length === 'standard' ? 'Standard' : 'Deep Dive';

  return (
    <div className="audio-overview-workspace">
      {!hasResult ? (
        <div className="audio-empty-state">
          <div className="audio-empty-icon">
            <Headphones size={20} />
          </div>
          <h3 className="audio-empty-title">Audio Overview</h3>
          <p className="audio-empty-desc">
            Turn your notebook sources into a concise two-host audio discussion with synchronized transcript.
          </p>
          <button
            type="button"
            onClick={() => onOpenDialog?.()}
            disabled={sources.length === 0}
            className="audio-generate-primary-btn"
          >
            <Plus size={14} />
            <span>Create Audio Overview</span>
          </button>
          {sources.length === 0 && (
            <span className="audio-empty-hint">Add at least one source first.</span>
          )}
        </div>
      ) : (
        <>
          <PodcastPlayerCard
            notebookId={notebookId}
            audioUrl={activeEp.audio_url || `/api/sourcebook/v1/study/audio/${notebookId}`}
            episodeTitle={epNumber > 0 ? `Audio Overview · Episode ${epNumber}` : 'Audio Overview'}
            episodeSubtitle={`${lengthLabel} · Austin & Taylor`}
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
            onOpenGenerate={() => onOpenDialog?.()}
            onRetry={handleGenerate}
            formatTime={formatTime}
          />

          {episodes.length > 1 && (
            <PodcastEpisodeList
              episodes={episodes}
              activeEpisodeId={activeEpId}
              onSelectEpisode={applyEpisode}
              formatTime={formatTime}
            />
          )}

          <OverviewStudioDetail
            summary={summary}
            takeaways={takeaways}
            turns={turns}
            onJumpToTime={jumpToTime}
            formatTime={formatTime}
          />
        </>
      )}
    </div>
  );
}
