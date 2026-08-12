import React from 'react';
import { SlidersHorizontal, MoreVertical, Sliders, PanelLeftOpen, PanelRightOpen } from 'lucide-react';
import MessageBubble from './MessageBubble';
import ThinkingIndicator from './ThinkingIndicator';
import PromptBar from './PromptBar';

export default function ChatStudio({
  messages,
  loading,
  maxSources,
  setMaxSources,
  onSendMessage,
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
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isLongDescription = notebookDescription && notebookDescription.length > 180;

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
        onSend={onSendMessage}
        loading={loading}
        maxSources={maxSources}
        setMaxSources={setMaxSources}
        allSources={allSources}
        sourceCount={allSources ? allSources.length : 0}
      />
    </div>
  );
}
