import { useState, useCallback } from 'react';
import { DEFAULT_MOCK_VIDEO } from '../pages/ytchat/ytMockData';

export function useYouTubeVideoDetails(activeId) {
  const [videoMeta, setVideoMeta] = useState({
    title: 'Loading video details...',
    channel: 'YouTube Video',
    duration: '00:00'
  });
  const [chapters, setChapters] = useState([]);
  const [transcript, setTranscript] = useState([]);
  const [syncStatus, setSyncStatus] = useState('syncing');

  const loadVideoDetails = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const titleParam = urlParams.get('title') || '';
      const payload = { video_id: activeId };
      if (titleParam) {
        payload.title = titleParam;
      }

      const res = await fetch('/api/sourcebook/v1/youtube/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setVideoMeta({
          title: data.title || titleParam || 'YouTube Video',
          channel: data.channel || 'YouTube Video',
          duration: data.duration || '00:00'
        });
        if (data.segments && data.segments.length > 0) {
          setTranscript(data.segments);
          setChapters(data.chapters || []);
          setSyncStatus('synced');
        } else {
          setSyncStatus(data.status === 'no_transcript' ? 'offline' : 'synced');
        }
      }
    } catch {
      setSyncStatus('offline');
    }
  }, [activeId]);

  return { videoMeta, chapters, transcript, syncStatus, loadVideoDetails };
}
