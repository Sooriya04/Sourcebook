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
  onRegenerate,
  onEditPrompt,
  isLatest
}) {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="chat-msg-user-row">
        <div className="chat-msg-user-bubble">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <article className="chat-msg-assistant">
      <div className="chat-msg-assistant-header">
        <span className="chat-msg-assistant-icon">
          <Sparkles size={12} />
        </span>
        <span className="chat-msg-assistant-name">SourceBook</span>
        {message.duration > 0 && (
          <span className="chat-msg-duration">
            <Clock size={10} />
            <span>{formatDuration(message.duration)}</span>
          </span>
        )}
      </div>

      <div className="chat-msg-assistant-body markdown-body">
        {parseCitations(message.content, message.sources, allSources, onCitationClick, activeCitation)}
      </div>

      {message.sources && message.sources.length > 0 && (
        <SourceDetailsPanel sources={message.sources} contextMode={message.context} />
      )}

      <ExecutionTrace trace={message.graph_trace} />

      <MessageActions
        content={message.content}
        isLatest={isLatest}
        onSaveNote={onSaveNote}
        onSendMessage={onSendMessage}
        onRegenerate={onRegenerate}
        onEditPrompt={message.promptMeta && onEditPrompt ? () => onEditPrompt(message.promptMeta) : undefined}
      />
    </article>
  );
}
