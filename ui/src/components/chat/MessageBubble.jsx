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
      const cleanTitle = message.content
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\([^)]*https?:\/\/[^)]*\)/g, '')
        .replace(/^#+\s*/g, '')
        .replace(/\[\d+\]/g, '')
        .trim();
      onSaveNote({
        id: `note-${Date.now()}`,
        title: (cleanTitle.slice(0, 45) || 'Saved AI Response') + (cleanTitle.length > 45 ? '...' : ''),
        content: message.content
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div 
      className={`message-card ${isUser ? 'user-msg' : 'ai-msg'}`}
      style={{
        display: 'flex',
        gap: '16px',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid var(--border-color)',
        background: isUser ? 'var(--canvas-2)' : 'var(--panel)',
        boxShadow: isUser ? 'none' : 'var(--shadow)',
        marginBottom: '16px',
        transition: 'background-color 0.2s ease',
      }}
    >
      <div 
        className={`avatar ${isUser ? 'user' : 'ai'}`}
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          background: isUser ? 'var(--accent-bg)' : 'var(--accent-primary)',
          color: isUser ? 'var(--accent-text)' : 'var(--canvas)',
        }}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className="message-content-box" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div 
          className="message-sender"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8rem',
            fontWeight: '600',
            fontFamily: 'var(--font-sans)',
            color: 'var(--text-muted)'
          }}
        >
          <span>{isUser ? 'You' : 'SourceBook AI'}</span>
          {!isUser && message.duration > 0 && (
            <span className="duration-tag" style={{ display: 'flex', alignItems: 'center', gap: '4px', opacity: 0.8 }}>
              <Clock size={11} />
              {formatDuration(message.duration)}
            </span>
          )}
        </div>

        <div 
          className="message-text"
          style={{
            fontSize: '0.94rem',
            lineHeight: '1.6',
            color: 'var(--text-main)',
            fontFamily: isUser ? 'var(--font-sans)' : 'var(--font-serif)',
          }}
        >
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
          <div className="message-actions" style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
            <button 
              className="action-btn" 
              onClick={handleCopy}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                fontSize: '0.74rem',
                cursor: 'pointer',
                transition: 'transform 0.1s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {copied ? <Check size={12} color="var(--text-main)" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            
            <button 
              className="action-btn" 
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'transparent',
                fontSize: '0.74rem',
                cursor: 'pointer',
                transition: 'transform 0.1s cubic-bezier(0.16, 1, 0.3, 1), background-color 0.15s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {saved ? <Check size={12} color="var(--text-main)" /> : <Bookmark size={12} />}
              <span>{saved ? 'Saved' : 'Save Note'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
