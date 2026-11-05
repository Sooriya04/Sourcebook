import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Globe, Sparkles, ExternalLink, Copy, Check, MessageSquare, ArrowLeft } from 'lucide-react';

export default function SourceInspector({ source, onClose, onExplainSource, onChatWithSource }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!source) return null;

  const rawContent = source.content || source.Content || source.text || source.Text || 
                     source.snippet || source.Snippet || source.description || '';

  const handleCopy = () => {
    if (!rawContent) return;
    navigator.clipboard.writeText(rawContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hostname = (() => {
    try { return source.url ? new URL(source.url).hostname.replace(/^www\./, '') : ''; } catch { return source.url || ''; }
  })();

  return (
    <div className="source-inspector-panel">
      <div className="inspector-header">
        <button type="button" onClick={onClose} title="Back (Esc)" className="inspector-back-btn">
          <ArrowLeft size={13} />
          <span>Back</span>
        </button>
        <span className="inspector-badge">[{source.index || 1}] Inspector</span>
      </div>

      <div className="inspector-body">
        <h3 className="inspector-title">{source.title || 'Untitled Source'}</h3>

        {source.url && (
          <div className="inspector-url-card">
            <div className="inspector-url-domain">
              <Globe size={12} className="text-zinc-400 shrink-0" />
              <span className="truncate">{hostname}</span>
            </div>
            <a href={source.url} target="_blank" rel="noreferrer" className="inspector-url-link" title="Open external link">
              <span>Visit</span>
              <ExternalLink size={11} />
            </a>
          </div>
        )}

        <div className="inspector-actions-grid">
          {onExplainSource && (
            <button type="button" onClick={() => onExplainSource(source)} className="inspector-action-primary" title="Ask AI to synthesize this source">
              <Sparkles size={12} />
              <span>Explain</span>
            </button>
          )}

          {onChatWithSource && (
            <button type="button" onClick={() => onChatWithSource(source)} className="inspector-action-secondary" title="Scope chat to this source">
              <MessageSquare size={12} />
              <span>Chat Only</span>
            </button>
          )}

          <button type="button" onClick={handleCopy} className={`inspector-action-copy ${copied ? 'copied' : ''}`} title="Copy source text">
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <div className="inspector-preview-card">
          {rawContent ? (
            <div className="inspector-markdown-body">
              <ReactMarkdown>{rawContent}</ReactMarkdown>
            </div>
          ) : (
            <div className="inspector-empty-text">No content available for this source.</div>
          )}
        </div>
      </div>
    </div>
  );
}
