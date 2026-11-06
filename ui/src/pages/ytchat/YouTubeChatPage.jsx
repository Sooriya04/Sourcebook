import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import YtChatHeader from '../../components/ytchat/YtChatHeader';
import YtVideoPlayer from '../../components/ytchat/YtVideoPlayer';
import YtTranscriptSidebar from '../../components/ytchat/YtTranscriptSidebar';
import YtChatPanel from '../../components/ytchat/YtChatPanel';
import { useYouTubeVideoDetails } from '../../hooks/useYouTubeVideoDetails';
import { DEFAULT_MOCK_VIDEO } from './ytMockData';

export default function YouTubeChatPage() {
  const { videoId } = useParams();
  const playerRef = useRef(null);
  const activeId = videoId || DEFAULT_MOCK_VIDEO.id;

  const { videoMeta, chapters, transcript, syncStatus, loadVideoDetails } = useYouTubeVideoDetails(activeId);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState('');
  const [isThinking, setIsThinking] = useState(false);

  const loadChatHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/sourcebook/v1/youtube/chat/history?video_id=${activeId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages?.length > 0) {
          setMessages(data.messages.map((m) => ({ id: m.id, sender: m.role, text: m.content })));
        }
      }
    } catch {}
  }, [activeId]);

  useEffect(() => {
    loadVideoDetails();
    loadChatHistory();
  }, [loadVideoDetails, loadChatHistory]);

  const handleSeek = (seconds) => {
    if (playerRef.current?.contentWindow) {
      playerRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
        '*'
      );
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputVal.trim() || isThinking) return;

    const query = inputVal.trim();
    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, sender: 'user', text: query }]);
    setInputVal('');
    setIsThinking(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const res = await fetch('/api/sourcebook/v1/youtube/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ video_id: activeId, query, history })
      });

      if (!res.ok) throw new Error('Chat failed');

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let assistantText = '';
      const assistantId = `a-${Date.now()}`;
      let buffer = '';
      let streamDone = false;
      // ponytail: ceiling is chunk buffer line splitting for SSE stream; upgrade path is native EventSource API.

      while (!streamDone) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // retain incomplete trailing line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6).trim();
            if (dataStr === '[DONE]') {
              streamDone = true;
              break;
            }
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.token) {
                assistantText += parsed.token;
                setMessages((prev) => [
                  ...prev.filter((m) => m.id !== assistantId),
                  { id: assistantId, sender: 'assistant', text: assistantText }
                ]);
              }
            } catch {}
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, sender: 'assistant', text: 'Unable to stream response from local LLM.' }
      ]);
    } finally {
      setIsThinking(false);
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
        onRefreshSync={loadVideoDetails}
      />
      <div className="ytc-main-layout">
        <div className="ytc-left-col">
          <YtVideoPlayer videoId={activeId} title={videoMeta.title} playerRef={playerRef} />
          <YtTranscriptSidebar chapters={chapters} transcript={transcript} onSeek={handleSeek} />
        </div>
        <div className="ytc-right-col">
          <YtChatPanel
            messages={messages}
            inputVal={inputVal}
            onChangeInput={setInputVal}
            onSend={handleSend}
            onSeek={handleSeek}
            onQuickPrompt={(key) => setInputVal(key === 'summary' ? 'Summarize key takeaways and timestamps' : key)}
            isThinking={isThinking}
            videoTitle={videoMeta.title}
          />
        </div>
      </div>
    </div>
  );
}
