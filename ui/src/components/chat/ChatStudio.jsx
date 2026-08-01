import React from 'react';
import { Sparkles } from 'lucide-react';
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
  chatEndRef
}) {
  const SUGGESTED_PROMPTS = [
    "What are the core capabilities of SourceBook?",
    "Synthesize key takeaways from my active sources",
    "Explain how SearXNG discovery works",
  ];

  return (
    <div className="chat-studio-panel">
      {messages.length === 0 ? (
        <div className="welcome-screen">
          <div className="welcome-icon">
            <Sparkles size={28} />
          </div>
          <h1 className="welcome-title">What would you like to explore today?</h1>
          <p className="welcome-subtitle">
            SourceBook queries live internet sources, parses uploaded documents, and synthesizes grounded answers with strict inline citations.
          </p>

          <div className="quick-prompts">
            {SUGGESTED_PROMPTS.map((promptText, idx) => (
              <button
                key={idx}
                className="prompt-chip"
                onClick={() => onSendMessage(promptText)}
              >
                {promptText}
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
