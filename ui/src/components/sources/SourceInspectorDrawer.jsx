import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { ExternalLink, X, Globe } from 'lucide-react';

export default function SourceInspectorDrawer({ source, onClose }) {
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
