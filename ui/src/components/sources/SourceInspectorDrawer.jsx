import React, { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ExternalLink, X, Globe, Search, Sparkles, Copy, Check } from 'lucide-react';

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default function SourceInspectorDrawer({ source, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('highlighted'); // 'highlighted' or 'markdown'
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

  const highlightText = (text, search, snippet) => {
    if (!text) return null;
    let parts = [text];
    
    // 1. Highlight exact snippet if present
    if (snippet && snippet.trim().length > 10) {
      const escapedSnippet = escapeRegExp(snippet.trim());
      const regex = new RegExp(`(${escapedSnippet})`, 'gi');
      const newParts = [];
      for (const part of parts) {
        if (typeof part === 'string') {
          const splitParts = part.split(regex);
          splitParts.forEach((sp, idx) => {
            if (regex.test(sp)) {
              newParts.push(
                <mark key={`snippet-${idx}`} className="source-snippet-highlight">
                  {sp}
                </mark>
              );
            } else {
              newParts.push(sp);
            }
          });
        } else {
          newParts.push(part);
        }
      }
      parts = newParts;
    }

    // 2. Highlight user search queries
    if (search && search.trim()) {
      const escapedSearch = escapeRegExp(search.trim());
      const regex = new RegExp(`(${escapedSearch})`, 'gi');
      const newParts = [];
      for (const part of parts) {
        if (typeof part === 'string') {
          const splitParts = part.split(regex);
          splitParts.forEach((sp, idx) => {
            if (regex.test(sp)) {
              newParts.push(
                <mark key={`search-${idx}`} className="source-query-highlight">
                  {sp}
                </mark>
              );
            } else {
              newParts.push(sp);
            }
          });
        } else {
          newParts.push(part);
        }
      }
      parts = newParts;
    }

    return parts;
  };

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

          {/* Search Box & View Mode Toggle */}
          <div className="drawer-toolbar">
            <div className="drawer-search-bar">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery('')}>
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="drawer-mode-toggle">
              <button
                className={viewMode === 'highlighted' ? 'active' : ''}
                onClick={() => setViewMode('highlighted')}
                title="Grounded view with citation highlights"
              >
                <Sparkles size={12} />
                <span>Grounded</span>
              </button>
              <button
                className={viewMode === 'markdown' ? 'active' : ''}
                onClick={() => setViewMode('markdown')}
                title="Raw formatted markdown document"
              >
                <span>Markdown</span>
              </button>
            </div>

            <button
              className={`drawer-copy-btn ${copied ? 'copied' : ''}`}
              onClick={handleCopy}
              title="Copy raw markdown text to clipboard"
            >
              {copied ? <Check size={12} className="check-icon" /> : <Copy size={12} />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <div className="drawer-content-section">
            <div className="drawer-text-preview-card">
              {contentText ? (
                <div className="markdown-content">
                  {viewMode === 'markdown' ? (
                    <ReactMarkdown>{contentText}</ReactMarkdown>
                  ) : (
                    <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', fontSize: '0.84rem', lineHeight: '1.7' }}>
                      {highlightText(contentText, searchQuery, source.snippet)}
                    </div>
                  )}
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
