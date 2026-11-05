import React, { useRef, useEffect, useState } from 'react';
import { Send, Sparkles, Clock, Copy, Check, MessageSquare, ListOrdered, BookOpen, BarChart3 } from 'lucide-react';

export default function YtChatPanel({
  messages,
  inputVal,
  onChangeInput,
  onSend,
  onSeek,
  onQuickPrompt,
  isThinking,
  videoTitle
}) {
  const bottomRef = useRef(null);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const renderFormatted = (text) => {
    const parts = text.split(/(\[\d{1,2}:\d{2}\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[(\d{1,2}:\d{2})\]/);
      if (match) {
        const ts = match[1];
        const [m, s] = ts.split(':').map(Number);
        const secs = m * 60 + s;
        return (
          <button
            key={i}
            type="button"
            className="ytc-timestamp-btn"
            onClick={() => onSeek(secs)}
            title={`Jump video to ${ts}`}
          >
            <Clock size={11} />
            <span>{ts}</span>
          </button>
        );
      }
      return part;
    });
  };

  return (
    <div className="ytc-chat-panel">
      <div className="ytc-chat-messages-scroll">
        {messages.length === 0 ? (
          <div className="ytc-chat-empty-state">
            <div className="ytc-empty-icon-bubble">
              <MessageSquare size={20} className="text-accent" />
            </div>
            <h3 className="ytc-empty-title">
              Chat with &quot;{videoTitle || 'this video'}&quot;
            </h3>
            <p className="ytc-empty-desc">
              Ask anything about topics covered in this video. Responses will cite precise timestamps that seek the player on the left.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`ytc-msg ${msg.sender}`}>
              <div className="ytc-bubble">
                <div className="ytc-msg-content">{renderFormatted(msg.text)}</div>
                {msg.sender === 'assistant' && (
                  <div className="ytc-msg-actions">
                    <button
                      type="button"
                      className="ytc-copy-btn"
                      onClick={() => handleCopy(msg.id, msg.text)}
                      title="Copy response"
                    >
                      {copiedId === msg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isThinking && (
          <div className="ytc-msg assistant">
            <div className="ytc-bubble thinking">
              <Sparkles size={14} className="spin text-accent" />
              <span>Analyzing video moments...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="ytc-chat-composer">
        <div className="ytc-quick-bar">
          <button
            type="button"
            className="ytc-quick-btn"
            onClick={() => onQuickPrompt('summary')}
          >
            <ListOrdered size={12} className="text-accent" />
            <span>Summarize key takeaways</span>
          </button>
          <button
            type="button"
            className="ytc-quick-btn"
            onClick={() => onQuickPrompt('Explain the core concept in detail')}
          >
            <BookOpen size={12} className="text-zinc-400" />
            <span>Explain core concept</span>
          </button>
          <button
            type="button"
            className="ytc-quick-btn"
            onClick={() => onQuickPrompt('What benchmarks or findings are discussed?')}
          >
            <BarChart3 size={12} className="text-zinc-400" />
            <span>Main findings & benchmarks</span>
          </button>
        </div>

        <form onSubmit={onSend} className="ytc-composer-form">
          <input
            type="text"
            className="ytc-input-field"
            placeholder="Ask anything about this video (e.g., 'What happens at 08:40?')..."
            value={inputVal}
            onChange={(e) => onChangeInput(e.target.value)}
          />
          <button
            type="submit"
            className="ytc-send-btn"
            disabled={!inputVal.trim() || isThinking}
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
