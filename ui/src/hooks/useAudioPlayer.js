import { useState, useRef, useEffect, useCallback } from 'react';

export function useAudioPlayer(notebookId) {
  const audioRef = useRef(null);
  const [currentEpisode, setCurrentEpisode] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1.0);

  const cleanAudioUrl = useCallback((ep) => {
    if (!ep) return `/api/sourcebook/v1/study/audio/${notebookId}?t=${Date.now()}`;
    let base = ep.audio_url || (ep.id ? `/api/sourcebook/v1/study/audio/${notebookId}?episode=${ep.id}` : `/api/sourcebook/v1/study/audio/${notebookId}`);
    base = base.replace(/[?&]t=\d+/g, '');
    const joiner = base.includes('?') ? '&' : '?';
    return `${base}${joiner}t=${Date.now()}`;
  }, [notebookId]);

  useEffect(() => {
    const audio = new Audio();
    audioRef.current = audio;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audioRef.current = null;
    };
  }, []);

  const playEpisode = useCallback((ep) => {
    if (!audioRef.current || !ep) return;
    const audio = audioRef.current;
    if (currentEpisode?.id === ep.id && audio.src) {
      audio.play().catch(() => {});
      return;
    }
    const url = cleanAudioUrl(ep);
    setCurrentEpisode(ep);
    audio.src = url;
    audio.playbackRate = speed;
    audio.currentTime = 0;
    audio.play().catch(() => {});
    setDuration(ep.duration || 0);
  }, [currentEpisode, cleanAudioUrl, speed]);

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, []);

  const togglePlayEpisode = useCallback((ep) => {
    if (!audioRef.current || !ep) return;
    const audio = audioRef.current;
    if (currentEpisode?.id === ep.id && isPlaying) {
      audio.pause();
    } else {
      playEpisode(ep);
    }
  }, [currentEpisode, isPlaying, playEpisode]);

  const seek = useCallback((time) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const setPlaybackSpeed = useCallback((newSpeed) => {
    setSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  }, []);

  return {
    currentEpisode,
    setCurrentEpisode,
    isPlaying,
    currentTime,
    duration,
    speed,
    playEpisode,
    pauseAudio,
    togglePlayEpisode,
    seek,
    setPlaybackSpeed,
    cleanAudioUrl
  };
}
