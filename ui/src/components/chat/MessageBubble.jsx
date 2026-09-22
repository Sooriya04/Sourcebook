import React, { useState } from 'react';
import { Sparkles, Clock, Copy, Check, Bookmark } from 'lucide-react';
import { parseCitations } from '../../utils/citationParser';
import { formatDuration } from '../../utils/formatters';
import SourceDetailsPanel from './SourceDetailsPanel';

export default function MessageBubble({ 
  message, 
  allSources, 
  onCitationClick, 
  activeCitation,
  onSaveNote,
  onSendMessage,
  isLatest
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
        .slice(0, 40)
        .trim();
      onSaveNote({
        title: cleanTitle ? `${cleanTitle}...` : 'AI Synthesis',
        content: message.content
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  // User Message: Sleek right-aligned chat bubble
  if (isUser) {
    return (
      <div className="user-message-row" style={{ display: 'flex', justifyContent: 'flex-end', margin: '10px 0', width: '100%' }}>
        <div 
          className="user-chat-bubble"
          style={{
            maxWidth: '75%',
            padding: '10px 14px',
            borderRadius: '16px 16px 4px 16px',
            background: 'var(--panel, #27272a)',
            color: 'var(--paper, #f4f4f5)',
            border: '1px solid var(--line, #3f3f46)',
            fontSize: '0.88rem',
            lineHeight: '1.5',
            wordBreak: 'break-word',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant Message: Clean open editorial style without card clutter
  return (
    <div className="ai-message-row" style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '14px 0 20px 0', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
        <div style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'var(--accent-primary)', color: 'var(--canvas)', display: 'grid', placeItems: 'center' }}>
          <Sparkles size={12} />
        </div>
        <span style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.82rem' }}>SourceBook</span>
        {message.duration > 0 && (
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={10} />
            {formatDuration(message.duration)}
          </span>
        )}
      </div>

      {/* Body Content */}
      <div className="ai-message-body" style={{ fontSize: '0.92rem', lineHeight: '1.7', color: 'var(--text-main)', padding: '0 2px', wordBreak: 'break-word', fontFamily: 'var(--font-sans)' }}>
        {parseCitations(message.content, message.sources, allSources, onCitationClick, activeCitation)}
      </div>

      {/* Grounded Sources Accordion */}
      {message.sources && message.sources.length > 0 && (
        <SourceDetailsPanel sources={message.sources} contextMode={message.context} />
      )}

      {/* Execution Graph Trace (if agentic) */}
      {message.graph_trace && message.graph_trace.length > 0 && (
        <details style={{ marginTop: '8px', fontSize: '0.74rem', border: '1px dashed var(--border-color)', borderRadius: '6px', padding: '6px 10px', background: 'var(--canvas-2)' }}>
          <summary style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--accent-primary)' }}>
            Execution Trace ({message.graph_trace.length} transitions)
          </summary>
          <div style={{ marginTop: '6px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {message.graph_trace.map((step, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '3px' }}>
                <span><strong>Step {step.step_number} [{step.state}]</strong>: {step.action || step.thought}</span>
                <span style={{ opacity: 0.7 }}>{step.duration_ms}ms</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* Actions & Follow-up Chips */}
      {message.content && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button 
              onClick={handleCopy}
              title="Copy message"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer' }}
            >
              {copied ? <Check size={12} color="var(--text-main)" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            
            <button 
              onClick={handleSave}
              title="Save as Studio Note"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.72rem', cursor: 'pointer' }}
            >
              {saved ? <Check size={12} color="var(--text-main)" /> : <Bookmark size={12} />}
              <span>{saved ? 'Saved' : 'Save Note'}</span>
            </button>
          </div>

          {isLatest && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
              {["Summarize key takeaways", "What are the limitations?", "Explain with an example"].map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSendMessage && onSendMessage(sug)}
                  style={{
                    fontSize: '0.7rem',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--canvas-2)',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text-main)'; e.currentTarget.style.borderColor = 'var(--accent-primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'var(--border-color)'; }}
                >
                  {sug}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
