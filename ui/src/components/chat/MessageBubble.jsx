import React from 'react';
import { Sparkles, Clock } from 'lucide-react';
import { parseCitations } from '../../utils/citationParser';
import { formatDuration } from '../../utils/formatters';
import SourceDetailsPanel from './SourceDetailsPanel';
import ExecutionTrace from './ExecutionTrace';
import MessageActions from './MessageActions';

export default function MessageBubble({
  message,
  allSources,
  onCitationClick,
  activeCitation,
  onSaveNote,
  onSendMessage,
  isLatest
}) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '8px 0', width: '100%' }}>
        <div
          className="user-chat-bubble"
          style={{
            maxWidth: '75%',
            padding: '9px 14px',
            borderRadius: '16px 16px 4px 16px',
            background: 'rgba(39, 39, 42, 0.8)',
            border: '1px solid rgba(63, 63, 70, 0.6)',
            color: '#f4f4f5',
            fontSize: '0.88rem',
            lineHeight: '1.5',
            wordBreak: 'break-word',
          }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '14px 0 20px', width: '100%' }}>
      {/* Editorial Assistant Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.78rem' }}>
        <div style={{
          width: '22px',
          height: '22px',
          borderRadius: '6px',
          background: 'rgba(99, 102, 241, 0.15)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          color: '#818cf8',
          display: 'grid',
          placeItems: 'center'
        }}>
          <Sparkles size={12} />
        </div>
        <span style={{ fontWeight: 600, color: '#f4f4f5', fontSize: '0.82rem' }}>SourceBook</span>
        {message.duration > 0 && (
          <span style={{ fontSize: '0.7rem', color: '#71717a', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={10} />
            {formatDuration(message.duration)}
          </span>
        )}
      </div>

      {/* Grounded Message Content */}
      <div style={{ fontSize: '0.91rem', lineHeight: '1.7', color: '#e4e4e7', padding: '0 2px', wordBreak: 'break-word' }}>
        {parseCitations(message.content, message.sources, allSources, onCitationClick, activeCitation)}
      </div>

      {/* Consulted Sources Panel */}
      {message.sources && message.sources.length > 0 && (
        <SourceDetailsPanel sources={message.sources} contextMode={message.context} />
      )}

      {/* Agentic Trace */}
      <ExecutionTrace trace={message.graph_trace} />

      {/* Actions & Follow-up Suggestions */}
      <MessageActions
        content={message.content}
        isLatest={isLatest}
        onSaveNote={onSaveNote}
        onSendMessage={onSendMessage}
      />
    </div>
  );
}
