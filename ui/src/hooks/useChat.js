import { useState, useRef, useEffect } from 'react';
import { chatQuery } from '../services/sourcebookApi';

export function useChat(initialMessages = [], onNewSourcesRetrieved) {
  const [messages, setMessages] = useState(initialMessages);
  const [loading, setLoading] = useState(false);
  const [maxSources, setMaxSources] = useState(5);
  const chatEndRef = useRef(null);

  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendMessage = async (queryText) => {
    if (!queryText?.trim() || loading) return;

    const userMessage = { role: 'user', content: queryText };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const data = await chatQuery({ query: queryText, maxSources });

      const aiMessage = {
        role: 'assistant',
        content: data.answer || 'No answer generated.',
        sources: data.sources || [],
        duration: data.duration_ms || 0
      };

      setMessages(prev => [...prev, aiMessage]);

      if (data.sources && data.sources.length > 0 && onNewSourcesRetrieved) {
        onNewSourcesRetrieved(data.sources);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: `Error synthesizing grounded response: ${err.message}`,
          sources: [],
          duration: 0
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
  };

  return {
    messages,
    setMessages,
    loading,
    maxSources,
    setMaxSources,
    sendMessage,
    clearChat,
    chatEndRef
  };
}
