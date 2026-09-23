import React, { useState, useEffect, useRef } from 'react';
import { ArrowDown, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MessageBubble from './MessageBubble';
import ThinkingIndicator from './ThinkingIndicator';
import PromptBar from './PromptBar';
import ChatHeader from './ChatHeader';
import ChatWelcomeScreen from './ChatWelcomeScreen';
import ChatShortcutsModal from './ChatShortcutsModal';
import Toast from '../ui/Toast';
import { useKeyboard } from '../../hooks/useKeyboard';
import { fetchLLMHealth } from '../../services/sourcebookApi';

export default function ChatStudio({
  messages,
  loading,
  streamPhase = 'retrieving',
  onSendMessage,
  onStopStream,
  onClearChat,
  allSources = [],
  scopedSourceIds,
  onCitationClick,
  activeCitation,
  onSaveNote,
  chatEndRef,
  notebookTitle,
  notebookDescription,
  isSourcesCollapsed,
  onToggleSources,
  isStudioCollapsed,
  onToggleStudio,
  onAddUrl
}) {
  const navigate = useNavigate();
  const [mode, setMode] = useState('notebook');
  const [llmHealth, setLlmHealth] = useState({ status: 'checking', model: '', embeddings: '' });
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const scrollAreaRef = useRef(null);
  const promptInputRef = useRef(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast({ message: '', type: 'info' }), 3000);
  };

  useEffect(() => {
    const check = () => fetchLLMHealth().then(setLlmHealth).catch(() => setLlmHealth({ status: 'offline', model: '', embeddings: '' }));
    check();
    const interval = setInterval(check, 6000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (llmHealth.status === 'offline') {
      setShowOfflineBanner(true);
      const timer = setTimeout(() => setShowOfflineBanner(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [llmHealth.status]);

  useKeyboard({
    onFocusPrompt: () => promptInputRef.current?.focus(),
    onToggleSources,
    onToggleStudio,
    onOpenShortcuts: () => setShowShortcuts(true),
    onCloseModals: () => setShowShortcuts(false)
  });

  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    setIsScrolledUp(scrollHeight - scrollTop - clientHeight > 90);
  };

  useEffect(() => {
    if (loading && !isScrolledUp) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isScrolledUp, chatEndRef]);

  const handleSend = (query) => {
    setIsScrolledUp(false);
    onSendMessage(query, mode, []);
  };

  return (
    <div className="chat-studio-panel" style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {toast.message && (
        <div className="toast-container" style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 120 }}>
          <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
        </div>
      )}

      <ChatHeader
        isSourcesCollapsed={isSourcesCollapsed}
        onToggleSources={onToggleSources}
        isStudioCollapsed={isStudioCollapsed}
        onToggleStudio={onToggleStudio}
        mode={mode}
        setMode={setMode}
        llmHealth={llmHealth}
        onOpenShortcuts={() => setShowShortcuts(true)}
        onClearChat={() => { onClearChat(); showToast('Chat history cleared', 'info'); }}
      />

      {showOfflineBanner && llmHealth.status === 'offline' && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px', padding: '6px 12px', margin: '8px 16px 0', fontSize: '0.74rem', color: '#ef4444'
        }}>
          <span>LLM provider is offline. Check connection in Settings.</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button onClick={() => navigate('/settings')} style={{ background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer' }}>Settings</button>
            <button onClick={() => setShowOfflineBanner(false)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><X size={13} /></button>
          </div>
        </div>
      )}

      {/* Main Centered Reading Column */}
      <div className="chat-scroll-area" ref={scrollAreaRef} onScroll={handleScroll} style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
        {messages.length === 0 ? (
          <ChatWelcomeScreen
            notebookTitle={notebookTitle}
            notebookDescription={notebookDescription}
            sourceCount={allSources ? allSources.length : 0}
            onSend={handleSend}
          />
        ) : (
          <div style={{ maxWidth: '780px', margin: '0 auto', padding: '20px 0 30px' }}>
            {messages.map((msg, idx) => (
              <MessageBubble
                key={idx}
                message={msg}
                allSources={allSources}
                onCitationClick={onCitationClick}
                activeCitation={activeCitation}
                onSaveNote={(note) => { if (onSaveNote) { onSaveNote(note); showToast('Saved to Studio notes!', 'success'); } }}
                onSendMessage={handleSend}
                isLatest={idx === messages.length - 1}
              />
            ))}
            {loading && <ThinkingIndicator phase={streamPhase} />}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {isScrolledUp && messages.length > 0 && (
        <button onClick={() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); setIsScrolledUp(false); }}
          className="scroll-bottom-btn" style={{
            position: 'absolute', bottom: '80px', right: '28px', background: 'var(--panel, #18181b)',
            border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '20px', padding: '6px 14px',
            color: 'var(--text-main, #fff)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: '0 4px 16px rgba(0,0,0,0.5)', zIndex: 30
          }}
        >
          <ArrowDown size={13} />
          <span>Latest response</span>
        </button>
      )}

      <ChatShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      <PromptBar
        ref={promptInputRef}
        onSend={handleSend}
        onStop={onStopStream}
        onAddUrl={onAddUrl}
        loading={loading}
        sourceCount={allSources ? allSources.length : 0}
        scopedCount={scopedSourceIds ? scopedSourceIds.size : (allSources ? allSources.length : 0)}
      />
    </div>
  );
}
