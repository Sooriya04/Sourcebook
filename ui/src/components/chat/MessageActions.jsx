import React, { useState } from 'react';
import { Copy, Check, Bookmark } from 'lucide-react';

const FOLLOW_UPS = ['Summarize key takeaways', 'What are the limitations?', 'Explain with an example'];

export default function MessageActions({ content, isLatest, onSaveNote, onSendMessage }) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy message"
          style={{
            display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px',
            border: '1px solid #27272a', background: 'rgba(24, 24, 27, 0.6)', color: copied ? '#f4f4f5' : '#a1a1aa',
            fontSize: '0.72rem', cursor: 'pointer', outline: 'none', transition: 'all 0.12s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3f3f46'; e.currentTarget.style.color = '#f4f4f5'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.color = copied ? '#f4f4f5' : '#a1a1aa'; }}
        >
          {copied ? <Check size={12} color="#34d399" /> : <Copy size={12} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          title="Save as Studio Note"
          style={{
            display: 'flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '6px',
            border: '1px solid #27272a', background: 'rgba(24, 24, 27, 0.6)', color: saved ? '#f4f4f5' : '#a1a1aa',
            fontSize: '0.72rem', cursor: 'pointer', outline: 'none', transition: 'all 0.12s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3f3f46'; e.currentTarget.style.color = '#f4f4f5'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.color = saved ? '#f4f4f5' : '#a1a1aa'; }}
        >
          {saved ? <Check size={12} color="#34d399" /> : <Bookmark size={12} />}
          <span>{saved ? 'Saved' : 'Save Note'}</span>
        </button>
      </div>

      {isLatest && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
          {FOLLOW_UPS.map((sug, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSendMessage && onSendMessage(sug)}
              style={{
                fontSize: '0.7rem', padding: '3px 9px', borderRadius: '12px', border: '1px solid #27272a',
                background: 'rgba(24, 24, 27, 0.7)', color: '#a1a1aa', cursor: 'pointer', outline: 'none',
                transition: 'all 0.12s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#818cf8'; e.currentTarget.style.color = '#f4f4f5'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#27272a'; e.currentTarget.style.color = '#a1a1aa'; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {sug}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
