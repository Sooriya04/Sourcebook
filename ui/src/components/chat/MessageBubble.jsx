import React, { useState } from 'react';
import { User, Bot, Clock, Copy, Check, Bookmark } from 'lucide-react';
import { parseCitations } from '../../utils/citationParser';
import { formatDuration } from '../../utils/formatters';
import SourceDetailsPanel from './SourceDetailsPanel';

export default function MessageBubble({ 
  message, 
  allSources, 
  onCitationClick, 
  activeCitation,
  onSaveNote 
}) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const isUser = message.role === 'user';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (onSaveNote) {
      onSaveNote({
        id: `note-${Date.now()}`,
        title: message.content.slice(0, 40) + '...',
        content: message.content
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className={`message-card ${isUser ? 'user-msg' : 'ai-msg'}`}>
      <div className={`avatar ${isUser ? 'user' : 'ai'}`}>
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>

      <div className="message-content-box">
        <div className="message-sender">
          <span>{isUser ? 'You' : 'SourceBook AI'}</span>
          {!isUser && message.duration > 0 && (
            <span className="duration-tag">
              <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
              {formatDuration(message.duration)}
            </span>
          )}
        </div>

        <div className="message-text">
          {isUser
            ? message.content
            : parseCitations(
                message.content, 
                message.sources, 
                allSources, 
                onCitationClick, 
                activeCitation
              )}
        </div>

        {!isUser && (
          <SourceDetailsPanel sources={message.sources} contextMode={message.context} />
        )}

        {!isUser && message.content && (
          <div className="message-actions">
            <button className="action-btn" onClick={handleCopy}>
              {copied ? <Check size={13} color="var(--text-main)" /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button className="action-btn" onClick={handleSave}>
              {saved ? <Check size={13} color="var(--text-main)" /> : <Bookmark size={13} />}
              {saved ? 'Saved' : 'Save Note'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
