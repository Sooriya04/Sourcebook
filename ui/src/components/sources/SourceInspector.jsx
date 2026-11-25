import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Globe,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  ArrowLeft,
  Mic,
  FileText
} from 'lucide-react';

export default function SourceInspector({
  source,
  onClose,
  onExplainSource,
  onChatWithSource
}) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!source) return null;

  const rawContent =
    source.content ||
    source.Content ||
    source.text ||
    source.Text ||
    source.snippet ||
    source.Snippet ||
    source.description ||
    '';

  const handleCopy = () => {
    if (!rawContent) return;
    navigator.clipboard.writeText(rawContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hostname = (() => {
    try {
      return source.url ? new URL(source.url).hostname.replace(/^www\./, '') : '';
    } catch {
      return source.url || '';
    }
  })();

  const isYouTube =
    source.type === 'youtube' ||
    source.url?.includes('youtube.com') ||
    source.url?.includes('youtu.be');

  const ytVideoId = (() => {
    if (!isYouTube || !source.url) return null;
    const match = source.url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/
    );
    return match ? match[1] : null;
  })();

  return (
    <div className="source-inspector-panel" role="region" aria-label="Node Inspector">
      {/* 1. Inspector Header */}
      <header className="inspector-header">
        <button
          type="button"
          onClick={onClose}
          title="Back to sources (Esc)"
          className="inspector-back-btn"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>

        <span className="inspector-header-label">Inspector</span>

        <span className="inspector-node-id" title={`Source node #${source.index || 1}`}>
          #{source.index || 1}
        </span>
      </header>

      {/* Single Independently Scrollable Document Reader Body */}
      <div className="inspector-body">
        {/* 2. Document Identity & Source Information */}
        <section className="inspector-identity-section">
          <h3 className="inspector-title">{source.title || 'Untitled Source'}</h3>

          {source.subtitle && (
            <p className="inspector-subtitle">{source.subtitle}</p>
          )}

          <div className="inspector-source-meta">
            {source.type === 'audio' && (
              <span className="inspector-meta-item">
                <Mic size={12} />
                <span>Audio Transcript</span>
              </span>
            )}
            {source.type === 'pdf' && (
              <span className="inspector-meta-item">
                <FileText size={12} />
                <span>PDF Document</span>
              </span>
            )}
            {source.url && (
              <div className="inspector-url-inline">
                <Globe size={12} className="inspector-url-icon" />
                <span className="inspector-url-host" title={source.url}>
                  {hostname}
                </span>
                <span className="inspector-meta-sep">·</span>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inspector-url-link"
                  title="Open external source"
                >
                  <span>Open source</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            )}
          </div>
        </section>

        {/* Embedded YouTube Player when applicable */}
        {ytVideoId && (
          <div className="inspector-video-embed">
            <iframe
              src={`https://www.youtube.com/embed/${ytVideoId}?rel=0&modestbranding=1`}
              title={source.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {/* 3. Source Actions */}
        <section className="inspector-actions-section" aria-label="Source actions">
          {onExplainSource && (
            <button
              type="button"
              onClick={() => onExplainSource(source)}
              className="inspector-btn-primary"
              title="Ask AI to synthesize this source"
            >
              <Sparkles size={13} />
              <span>Explain</span>
            </button>
          )}

          {onChatWithSource && (
            <button
              type="button"
              onClick={() => onChatWithSource(source)}
              className="inspector-btn-secondary"
              title="Scope chat strictly to this source"
            >
              <MessageSquare size={13} />
              <span>Chat Only</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            className={`inspector-btn-secondary ${copied ? 'copied' : ''}`}
            title="Copy extracted text"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </section>

        {/* 4. Extracted Content Viewer (Clean, borderless document reader) */}
        <section className="inspector-content-section" aria-label="Extracted content">
          {rawContent ? (
            <div className="inspector-markdown-body">
              <ReactMarkdown>{rawContent}</ReactMarkdown>
            </div>
          ) : (
            <div className="inspector-empty-text">
              No extracted content available for this source.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
