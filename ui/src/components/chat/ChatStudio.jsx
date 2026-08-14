import React, { useState, useEffect } from 'react';
import { SlidersHorizontal, MoreVertical, Sliders, PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ThinkingIndicator from './ThinkingIndicator';
import PromptBar from './PromptBar';
import ChatControls from './ChatControls';
import { fetchLLMHealth } from '../../services/sourcebookApi';

export default function ChatStudio({
  messages,
  loading,
  maxSources,
  setMaxSources,
  onSendMessage,
  onStopStream,
  onRegenerate,
  onEditAndResend,
  onClearChat,
  allSources,
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
  const [mode, setMode] = useState('web');
  const [llmHealth, setLlmHealth] = useState({ status: 'offline', model: '', embeddings: '' });
  
  const isLongDescription = notebookDescription && notebookDescription.length > 180;

  useEffect(() => {
    fetchLLMHealth()
      .then(setLlmHealth)
      .catch(err => {
        console.warn("Failed to check LLM health:", err);
        setLlmHealth({ status: 'offline', model: '', embeddings: '' });
      });
  }, []);

  const handleSend = (query, scopedSourceIds) => {
    onSendMessage(query, mode, scopedSourceIds);
  };

  return (
    <div className="chat-studio-panel">
      {/* Top Header */}
      <div className="chat-panel-header">
        <div className="chat-header-left">
          <button 
            className={`expand-panel-pill-btn ${isSourcesCollapsed ? 'collapsed-pill' : 'active-pill'}`} 
            onClick={onToggleSources}
            title="Toggle Sources Panel"
          >
            <PanelLeftOpen size={15} />
            <span>Sources</span>
          </button>
          <h3 className="chat-panel-title">Chat</h3>
        </div>

        <div className="chat-header-actions">
          <button className="chat-icon-btn" title="Customize Chat System Prompt">
            <Sliders size={14} />
            <span>Customize</span>
          </button>
          <button className="chat-icon-btn icon-only" title="Filter RAG Sources">
            <SlidersHorizontal size={15} />
          </button>
          <button className="chat-icon-btn icon-only" title="Chat Options">
            <MoreVertical size={15} />
          </button>
          <button 
            className={`expand-panel-pill-btn ${isStudioCollapsed ? 'collapsed-pill' : 'active-pill'}`} 
            onClick={onToggleStudio}
            title="Toggle Studio Panel"
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Mode:</span>
          <select 
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            style={{
              background: 'var(--bg-app)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-main)',
              padding: '4px 10px',
              borderRadius: '6px',
              cursor: 'pointer',
              outline: 'none',
              fontSize: '0.8rem',
              fontWeight: 500
            }}
          >
            <option value="web">Web Search</option>
            <option value="notebook">Notebook Sources</option>
            <option value="hybrid">Notebook + Web (Hybrid)</option>
          </select>
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
        onRegenerate={onRegenerate} 
        onStop={onStopStream} 
        loading={loading} 
        hasMessages={messages.length > 0} 
      />

      <div className="chat-scroll-area">
        {messages.length === 0 ? (
          <div className="welcome-screen">
            <h1 className="welcome-title">{notebookTitle || 'SourceBook Workspace'}</h1>
            <div className="welcome-subtitle-container">
              <p className={`welcome-subtitle ${!isExpanded && isLongDescription ? 'truncated' : ''}`}>
                {notebookDescription || 'Your local-first grounded intelligence platform. Query all your uploaded sources with numerical citations.'}
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
                onSaveNote={onSaveNote}
              />
            ))}

            {loading && <ThinkingIndicator />}
            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      <PromptBar
        onSend={handleSend}
        loading={loading}
        maxSources={maxSources}
        setMaxSources={setMaxSources}
        allSources={allSources}
        sourceCount={allSources ? allSources.length : 0}
      />
    </div>
  );
}
