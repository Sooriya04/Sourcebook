import React, { useState } from 'react';
import { Copy, Check, Bookmark, RotateCcw } from 'lucide-react';

const FOLLOW_UPS = [
  'Summarize key takeaways',
  'What are the limitations?',
  'Explain with an example'
];

export default function MessageActions({
  content,
  isLatest,
  onSaveNote,
  onSendMessage,
  onRegenerate
}) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!content) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = () => {
    if (onSaveNote) {
      const cleanTitle = content
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\([^)]*https?:\/\/[^)]*\)/g, '')
        .replace(/^#+\s*/g, '')
        .slice(0, 40)
        .trim();
      onSaveNote({
        title: cleanTitle ? `${cleanTitle}...` : 'AI Synthesis',
        content
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="chat-msg-actions-wrapper">
      <div className={`chat-msg-actions-bar ${isLatest ? 'visible' : ''}`}>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy response"
          className={`chat-action-btn ${copied ? 'active' : ''}`}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          title="Save as Studio Note"
          className={`chat-action-btn ${saved ? 'active' : ''}`}
        >
          {saved ? <Check size={12} /> : <Bookmark size={12} />}
          <span>{saved ? 'Saved' : 'Save Note'}</span>
        </button>

        {isLatest && onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            title="Regenerate response"
            className="chat-action-btn"
          >
            <RotateCcw size={12} />
            <span>Regenerate</span>
          </button>
        )}
      </div>

      {isLatest && (
        <div className="chat-followups-row">
          {FOLLOW_UPS.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSendMessage && onSendMessage(sug)}
              className="chat-followup-btn"
            >
              {sug}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
