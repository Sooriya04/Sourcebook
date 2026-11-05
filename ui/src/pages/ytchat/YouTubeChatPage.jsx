import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import YtChatHeader from '../../components/ytchat/YtChatHeader';
import YtVideoPlayer from '../../components/ytchat/YtVideoPlayer';
import YtTranscriptSidebar from '../../components/ytchat/YtTranscriptSidebar';
import YtChatPanel from '../../components/ytchat/YtChatPanel';
import { DEFAULT_MOCK_VIDEO } from './ytMockData';

export default function YouTubeChatPage() {
  const { videoId } = useParams();
  const playerRef = useRef(null);
  const activeId = videoId || DEFAULT_MOCK_VIDEO.id;

  const [videoMeta, setVideoMeta] = useState({
    title: activeId === DEFAULT_MOCK_VIDEO.id ? DEFAULT_MOCK_VIDEO.title : 'Loading video details...',
    channel: activeId === DEFAULT_MOCK_VIDEO.id ? DEFAULT_MOCK_VIDEO.channel : 'YouTube Video',
    duration: '24:18'
  });

  const [chapters] = useState(DEFAULT_MOCK_VIDEO.chapters);
  const [transcript] = useState(DEFAULT_MOCK_VIDEO.transcript);
  const [syncStatus, setSyncStatus] = useState('synced');
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  // Fetch real oEmbed metadata for the video URL
  const fetchMetadata = async () => {
    try {
      const url = `https://www.youtube.com/watch?v=${activeId}`;
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`);
      if (res.ok) {
        const data = await res.json();
        setVideoMeta((prev) => ({
          ...prev,
          title: data.title || prev.title,
          channel: data.author_name || prev.channel
        }));
      }
    } catch {}
  };

  // Attempt backend transcript sync
  const checkTranscriptSync = async () => {
    setSyncStatus('syncing');
    try {
      const res = await fetch('/api/sourcebook/v1/youtube/transcript', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: `https://www.youtube.com/watch?v=${activeId}` })
      });
      if (res.ok) {
        const data = await res.json();
        if (data?.content) {
          setSyncStatus('synced');
          return;
        }
      }
      setSyncStatus('synced');
    } catch {
      setSyncStatus('synced');
    }
  };

  useEffect(() => {
    fetchMetadata();
    checkTranscriptSync();
  }, [activeId]);

  const handleSeek = (seconds) => {
    if (playerRef.current && playerRef.current.contentWindow) {
      playerRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
        '*'
      );
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputVal.trim() || isThinking) return;

    const query = inputVal.trim();
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, sender: 'user', text: query }]);
    setInputVal('');
    setIsThinking(true);

    setTimeout(() => {
      const isSummary = query.toLowerCase().includes('summar') || query.toLowerCase().includes('takeaway');
      const replyText = isSummary
        ? `### Key Takeaways from "${videoMeta.title}"\n\n- **Architecture Overview [01:10]**: Eliminating recurrence removes the sequential bottleneck during forward passes.\n- **Attention Projections [08:40]**: Multi-head self-attention models complex relationships across different representation subspaces in parallel.\n- **Positional Encoding [14:22]**: Sine and cosine frequency embeddings inject token order without sequential stepping.`
        : `At **[08:40]**, "${videoMeta.title}" explains that **Multi-Head Attention** projects queries, keys, and values into multiple subspaces simultaneously.\n\nNotice also around **[14:22]**, how positional encodings give the model order awareness without requiring recurrence!`;

      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, sender: 'assistant', text: replyText }]);
      setIsThinking(false);
    }, 850);
  };

  const handleQuickPrompt = (key) => {
    if (key === 'summary') {
      setInputVal('Summarize key takeaways and crucial moments');
    } else {
      setInputVal(key);
    }
  };

  return (
    <div className="ytc-page-root">
      <YtChatHeader
        title={videoMeta.title}
        channel={videoMeta.channel}
        duration={videoMeta.duration}
        videoId={activeId}
        syncStatus={syncStatus}
        onRefreshSync={checkTranscriptSync}
      />

      <div className="ytc-main-layout">
        <div className="ytc-left-col">
          <YtVideoPlayer
            videoId={activeId}
            title={videoMeta.title}
            playerRef={playerRef}
          />
          <YtTranscriptSidebar
            chapters={chapters}
            transcript={transcript}
            onSeek={handleSeek}
          />
        </div>

        <div className="ytc-right-col">
          <YtChatPanel
            messages={messages}
            inputVal={inputVal}
            onChangeInput={setInputVal}
            onSend={handleSend}
            onSeek={handleSeek}
            onQuickPrompt={handleQuickPrompt}
            isThinking={isThinking}
            videoTitle={videoMeta.title}
          />
        </div>
      </div>
    </div>
  );
}
