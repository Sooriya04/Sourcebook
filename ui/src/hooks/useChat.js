import { useState, useRef, useEffect } from 'react';
import { chatQueryStream, fetchSettings } from '../services/sourcebookApi';

export function useChat(initialMessages = [], onNewSourcesRetrieved, notebookId = null) {
  const [messages, setMessages] = useState(initialMessages);
  const [loading, setLoading] = useState(false);
  const [streamPhase, setStreamPhase] = useState('retrieving');
  const [maxSources, setMaxSources] = useState(5);
  const abortControllerRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    fetchSettings().then(s => {
      if (s && s.max_sources) {
        setMaxSources(s.max_sources);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const stopStream = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  };

  const sendMessage = async (queryText, mode = 'notebook', overrideHistory = null) => {
    if (!queryText?.trim() || loading) return;

    // Abort any existing stream
    stopStream();

    const userMessage = { role: 'user', content: queryText };
    const history = overrideHistory || messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    // Add User message and placeholder Assistant message
    const newMessages = [...messages, userMessage];
    const assistantIndex = newMessages.length;
    
    setMessages([
      ...newMessages,
      { role: 'assistant', content: '', sources: [], context: '', loading: true }
    ]);
    setLoading(true);
    setStreamPhase('retrieving');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      await chatQueryStream({
        query: queryText,
        notebookId,
        maxSources,
        scopedSourceIds: [],
        mode,
        history,
        abortSignal: controller.signal,
        onChunk: (token) => {
          setStreamPhase('synthesizing');
          setMessages(prev => {
            const next = [...prev];
            if (next[assistantIndex]) {
              next[assistantIndex] = {
                ...next[assistantIndex],
                content: next[assistantIndex].content + token,
                loading: false
              };
            }
            return next;
          });
        },
        onMetadata: (meta) => {
          if (meta.status !== undefined) {
            setStreamPhase(meta.status);
            return;
          }
          setMessages(prev => {
            const next = [...prev];
            if (next[assistantIndex]) {
              next[assistantIndex] = {
                ...next[assistantIndex],
                sources: meta.sources || [],
                context: meta.context || '',
                loading: false
              };
            }
            return next;
          });
          if (meta.new_sources && meta.new_sources.length > 0 && onNewSourcesRetrieved) {
            onNewSourcesRetrieved(meta.new_sources);
          }
        },
        onError: (errMsg) => {
          setMessages(prev => {
            const next = [...prev];
            if (next[assistantIndex]) {
              next[assistantIndex] = {
                ...next[assistantIndex],
                content: errMsg,
                sources: [],
                context: '',
                loading: false,
                error: true
              };
            }
            return next;
          });
        }
      });
    } catch (err) {
      console.error('SSE Error:', err);
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const regenerateMessage = (mode = 'notebook') => {
    // Find last user message
    const userMsgIdx = [...messages].reverse().findIndex(m => m.role === 'user');
    if (userMsgIdx === -1) return;

    const actualIdx = messages.length - 1 - userMsgIdx;
    const lastQuery = messages[actualIdx].content;

    // Slice messages to exclude last assistant answer and last user query to recreate clean history
    const historySlice = messages.slice(0, actualIdx).map(m => ({
      role: m.role,
      content: m.content
    }));

    setMessages(prev => prev.slice(0, actualIdx));
    sendMessage(lastQuery, mode, historySlice);
  };

  const editAndResendMessage = (index, newText, mode = 'notebook') => {
    if (index < 0 || index >= messages.length) return;

    // Slice up to edited index
    const historySlice = messages.slice(0, index).map(m => ({
      role: m.role,
      content: m.content
    }));

    setMessages(prev => prev.slice(0, index));
    sendMessage(newText, mode, historySlice);
  };

  const clearChat = () => {
    stopStream();
    setMessages([]);
  };

  return {
    messages,
    setMessages,
    loading,
    streamPhase,
    maxSources,
    setMaxSources,
    sendMessage,
    stopStream,
    regenerateMessage,
    editAndResendMessage,
    clearChat,
    chatEndRef
  };
}
