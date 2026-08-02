import React from 'react';

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
  notebookDescription
}) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const isLongDescription = notebookDescription && notebookDescription.length > 180;

  return (
    <div className="chat-studio-panel">
      {messages.length === 0 ? (
        <div className="welcome-screen">
          <h1 className="welcome-title">{notebookTitle || 'SourceBook'}</h1>
          <div className="welcome-subtitle-container">
            <p className={`welcome-subtitle ${!isExpanded && isLongDescription ? 'truncated' : ''}`}>
              {notebookDescription || 'Your local autonomous research engine. Ask questions and synthesize grounded answers.'}
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

      <PromptBar
        onSend={onSendMessage}
        loading={loading}
        maxSources={maxSources}
        setMaxSources={setMaxSources}
      />
    </div>
  );
}
