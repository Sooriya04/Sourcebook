import React, { useState, useEffect, useRef } from 'react';
import { 
  SlidersHorizontal, 
  MoreVertical, 
  Sliders, 
  PanelLeftOpen, 
  PanelRightOpen, 
  ArrowDown, 
  Sparkles, 
  BookOpen, 
  Layers, 
  Keyboard, 
  X,
  Trash2,
  Globe
} from 'lucide-react';
import MessageBubble from './MessageBubble';
import ThinkingIndicator from './ThinkingIndicator';
import PromptBar from './PromptBar';
import ChatControls from './ChatControls';
import Toast from '../ui/Toast';
import { useKeyboard } from '../../hooks/useKeyboard';
import { fetchLLMHealth } from '../../services/sourcebookApi';

export default function ChatStudio({
  messages,
  loading,
  streamPhase = 'retrieving',
  maxSources,
  setMaxSources,
  onSendMessage,
  onStopStream,
  onRegenerate,
  onEditAndResend,
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
  onToggleStudio
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState('notebook');
  const [llmHealth, setLlmHealth] = useState({ status: 'offline', model: '', embeddings: '' });
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  const scrollAreaRef = useRef(null);
  const promptInputRef = useRef(null);

  const isLongDescription = notebookDescription && notebookDescription.length > 180;

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 3200);
  };

  useEffect(() => {
    const checkHealth = () => {
      fetchLLMHealth()
        .then(setLlmHealth)
        .catch(err => {
          console.warn("Failed to check LLM health:", err);
          setLlmHealth({ status: 'offline', model: '', embeddings: '' });
        });
    };
    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard Shortcuts Handler
  useKeyboard({
    onFocusPrompt: () => promptInputRef.current?.focus(),
    onToggleSources,
    onToggleStudio,
    onOpenShortcuts: () => setShowShortcutsModal(true),
    onCloseModals: () => {
      setShowMenu(false);
      setShowShortcutsModal(false);
    }
  });

  // Handle scroll detection
  const handleScroll = () => {
    if (!scrollAreaRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
    const isBottom = scrollHeight - scrollTop - clientHeight < 90;
    setIsScrolledUp(!isBottom);
  };

  // Auto-scroll on new chunks ONLY if user hasn't manually scrolled up
  useEffect(() => {
    if (loading && !isScrolledUp) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isScrolledUp, chatEndRef]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsScrolledUp(false);
  };

  const handleSend = (query) => {
    setIsScrolledUp(false);
    onSendMessage(query, mode, []);
  };

  const handleSaveNoteWithToast = (noteData) => {
    if (onSaveNote) {
      onSaveNote(noteData);
      showToast('Note saved to Studio!', 'success');
    }
  };

  const starterChips = [
    {
      icon: <Sparkles size={14} className="starter-chip-icon" />,
      title: "Summarize Key Themes",
      query: "Provide a structured summary of the key themes and findings across all sources."
    },
    {
      icon: <BookOpen size={14} className="starter-chip-icon" />,
      title: "Compare Perspectives",
      query: "Compare different perspectives, arguments, and conclusions presented in the sources."
    },
    {
      icon: <Layers size={14} className="starter-chip-icon" />,
      title: "Executive Overview",
      query: "Generate an executive overview highlighting the critical takeaways and evidence."
    }
  ];

  return (
    <div className="chat-studio-panel" style={{ position: 'relative' }}>
      {/* Toast Notification Container */}
      {toast.message && (
        <div className="toast-container">
          <Toast message={toast.message} type={toast.type} onClose={() => setToast({ message: '', type: 'info' })} />
        </div>
      )}

      {/* Top Header */}
      <div className="chat-panel-header">
        <div className="chat-header-left">
          <button 
            className={`expand-panel-pill-btn ${isSourcesCollapsed ? 'collapsed-pill' : 'active-pill'}`} 
            onClick={onToggleSources}
            title="Toggle Sources Panel (Cmd+/)"
          >
            <PanelLeftOpen size={15} />
            <span>Sources</span>
          </button>
          <h3 className="chat-panel-title">Chat</h3>
        </div>

        <div className="chat-header-actions" style={{ position: 'relative' }}>
          <button className="chat-icon-btn" title="Customize System Prompt">
            <Sliders size={14} />
            <span>Customize</span>
          </button>
          <button className="chat-icon-btn icon-only" title="Filter RAG Sources">
            <SlidersHorizontal size={15} />
          </button>
          
          <button 
            className="chat-icon-btn icon-only" 
            title="Chat Options"
            onClick={() => setShowMenu(!showMenu)}
          >
            <MoreVertical size={15} />
          </button>

          {/* Three-dot Options Dropdown Menu */}
          {showMenu && (
            <div style={{
              position: 'absolute',
              top: '36px',
              right: '90px',
              background: 'var(--panel)',
              border: '1px solid var(--line-strong)',
              borderRadius: '8px',
              boxShadow: 'var(--shadow)',
              padding: '6px',
              zIndex: 100,
              display: 'flex',
              flexDirection: 'column',
              minWidth: '180px'
            }}>
              <button 
                onClick={() => {
                  setShowShortcutsModal(true);
                  setShowMenu(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--paper)',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Keyboard size={14} />
                  <span>Shortcuts</span>
                </div>
                <span className="shortcut-key-badge">⌘?</span>
              </button>

              <button 
                onClick={() => {
                  onClearChat();
                  setShowMenu(false);
                  showToast('Chat history cleared', 'info');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <Trash2 size={14} />
                <span>Clear Chat</span>
              </button>
            </div>
          )}

          <button 
            className={`expand-panel-pill-btn ${isStudioCollapsed ? 'collapsed-pill' : 'active-pill'}`} 
            onClick={onToggleStudio}
            title="Toggle Studio Panel (Cmd+Shift+S)"
          >
            <PanelRightOpen size={15} />
            <span>Studio</span>
          </button>
        </div>
      </div>

      {/* Mode Selector & Status sub-header */}
      <div className="chat-sub-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 16px',
        borderBottom: '1px solid var(--border-color)',
        background: 'rgba(255, 255, 255, 0.01)',
        fontSize: '0.82rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ display: 'inline-flex', background: 'var(--canvas-2)', border: '1px solid var(--border-color)', borderRadius: '18px', padding: '2px' }}>
            <button 
              type="button"
              onClick={() => setMode('notebook')}
              style={{
                padding: '3px 10px',
                borderRadius: '14px',
                border: 'none',
                background: mode === 'notebook' ? 'var(--accent-primary)' : 'transparent',
                color: mode === 'notebook' ? 'var(--canvas)' : 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
            >
              <BookOpen size={11} />
              <span>Sources</span>
            </button>
            <button 
              type="button"
              onClick={() => setMode('web')}
              style={{
                padding: '3px 10px',
                borderRadius: '14px',
                border: 'none',
                background: mode === 'web' ? 'var(--accent-primary)' : 'transparent',
                color: mode === 'web' ? 'var(--canvas)' : 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
            >
              <Globe size={11} />
              <span>Web</span>
            </button>
            <button 
              type="button"
              onClick={() => setMode('hybrid')}
              style={{
                padding: '3px 10px',
                borderRadius: '14px',
                border: 'none',
                background: mode === 'hybrid' ? 'var(--accent-primary)' : 'transparent',
                color: mode === 'hybrid' ? 'var(--canvas)' : 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease'
              }}
            >
              <Sparkles size={11} />
              <span>Hybrid</span>
            </button>
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: llmHealth.status === 'online' ? '#10b981' : '#ef4444',
            boxShadow: llmHealth.status === 'online' ? '0 0 8px #10b981' : '0 0 8px #ef4444',
            display: 'inline-block'
          }}></span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            {llmHealth.status === 'online' ? `${llmHealth.model} (Online)` : 'LLM Offline'}
          </span>
        </div>
      </div>

      {/* Interactive Controls */}
      <ChatControls 
        onClear={onClearChat} 
        onRegenerate={() => onRegenerate(mode)} 
        onStop={onStopStream} 
        loading={loading} 
        hasMessages={messages.length > 0} 
      />

      {/* Scrollable Chat Area */}
      <div 
        className="chat-scroll-area" 
        ref={scrollAreaRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="welcome-screen" style={{ maxWidth: '640px', margin: '0 auto', textAlign: 'center', padding: '40px 20px' }}>
            <h1 className="welcome-title" style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '8px' }}>
              {notebookTitle || 'SourceBook Workspace'}
            </h1>
            <div className="welcome-subtitle-container" style={{ marginBottom: '24px' }}>
              <p className={`welcome-subtitle ${!isExpanded && isLongDescription ? 'truncated' : ''}`} style={{ fontSize: '0.86rem', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                {notebookDescription || 'Grounded intelligence platform. Query all your uploaded sources with numerical citations.'}
              </p>
              {isLongDescription && (
                <button 
                  type="button" 
                  className="welcome-subtitle-toggle"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>

            {/* Prompt Suggestion Pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {starterChips.map((chip, i) => (
                <button 
                  key={i} 
                  type="button"
                  onClick={() => handleSend(chip.query)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 14px',
                    borderRadius: '20px',
                    background: 'var(--canvas-2)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-main)',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.backgroundColor = 'var(--canvas-2)'; }}
                >
                  {chip.icon}
                  <span>{chip.title}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="chat-container">
            {messages.map((msg, idx) => (
              <MessageBubble
                key={idx}
                message={msg}
                allSources={allSources}
                onCitationClick={onCitationClick}
                activeCitation={activeCitation}
                onSaveNote={handleSaveNoteWithToast}
              />
            ))}

            {loading && <ThinkingIndicator phase={streamPhase} />}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Floating Scroll to Bottom Button */}
      {isScrolledUp && messages.length > 0 && (
        <button 
          className="scroll-bottom-btn"
          onClick={scrollToBottom}
        >
          <ArrowDown size={14} />
          <span>Latest response</span>
        </button>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcutsModal && (
        <div className="shortcuts-modal-overlay" onClick={() => setShowShortcutsModal(false)}>
          <div className="shortcuts-modal" onClick={(e) => e.stopPropagation()}>
            <div className="shortcuts-modal-header">
              <div className="shortcuts-modal-title">
                <Keyboard size={18} />
                <span>Keyboard Shortcuts</span>
              </div>
              <button 
                style={{ background: 'transparent', border: 'none', color: 'var(--dim)', cursor: 'pointer' }}
                onClick={() => setShowShortcutsModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="shortcuts-list">
              <div className="shortcut-item">
                <span>Focus Prompt Bar</span>
                <span className="shortcut-key-badge">⌘ K</span>
              </div>
              <div className="shortcut-item">
                <span>Toggle Sources Panel</span>
                <span className="shortcut-key-badge">⌘ /</span>
              </div>
              <div className="shortcut-item">
                <span>Toggle Studio Panel</span>
                <span className="shortcut-key-badge">⌘ Shift S</span>
              </div>
              <div className="shortcut-item">
                <span>Show Shortcuts Menu</span>
                <span className="shortcut-key-badge">⌘ Shift ?</span>
              </div>
              <div className="shortcut-item">
                <span>Close Popovers / Modals</span>
                <span className="shortcut-key-badge">Esc</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <PromptBar
        ref={promptInputRef}
        onSend={handleSend}
        loading={loading}
        sourceCount={allSources ? allSources.length : 0}
        scopedCount={scopedSourceIds ? scopedSourceIds.size : (allSources ? allSources.length : 0)}
      />
    </div>
  );
}
