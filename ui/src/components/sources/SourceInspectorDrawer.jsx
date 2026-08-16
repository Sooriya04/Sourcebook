import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ExternalLink, X, Globe, Search, Sparkles, Copy, Check } from 'lucide-react';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function SourceInspectorDrawer({ source, onClose, onExplain }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!source.content) return;
    navigator.clipboard.writeText(source.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!source) return null;

  const contentText =
    source.content ||
    source.Content ||
    source.text ||
    source.Text ||
    source.snippet ||
    source.Snippet ||
    source.description ||
    source.Description;

  const citationNum = source.index || 1;

  let domain = '';
  if (source.url) {
    try {
      domain = new URL(source.url).hostname.replace('www.', '');
    } catch {
      domain = source.url;
    }
  }

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title-group">
            <span className="source-citation-pill">[{citationNum}]</span>
            <span className="drawer-title">{source.title || 'Untitled Source'}</span>
          </div>
          <button className="close-btn" onClick={onClose} title="Close drawer">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {source.url && (
            <div className="drawer-url-card">
              <div className="drawer-url-info">
                <Globe size={14} className="globe-icon" />
                <span className="drawer-url-domain">{domain}</span>
              </div>
              <a href={source.url} target="_blank" rel="noreferrer" className="drawer-external-link">
                <span>Visit Source</span>
                <ExternalLink size={13} />
              </a>
            </div>
          )}

          {/* Copy and Explain Buttons */}
          <div className="drawer-toolbar" style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: '8px', marginBottom: '14px' }}>
            {onExplain ? (
              <button
                className="drawer-copy-btn active"
                onClick={() => onExplain(source)}
                title="Ask AI to explain this source in detail"
                style={{ background: '#3b82f6', color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '600' }}
              >
                <Sparkles size={12} />
                <span>Explain Source</span>
              </button>
            ) : <div />}
            <button
              className={`drawer-copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
              title="Copy raw markdown text to clipboard"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', padding: '6px 12px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: '600' }}
            >
              {copied ? <Check size={12} className="check-icon" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="drawer-content-section">
            <div className="drawer-text-preview-card">
              {contentText ? (
                <div className="markdown-content">
                  <ReactMarkdown>{contentText}</ReactMarkdown>
                </div>
              ) : (
                <div className="empty-content-container">
                  <p className="empty-text-hint">
                    No content available for source <code>[{citationNum}]</code>.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
