import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Plus, PanelLeftClose, Search, Globe, Sparkles, X, ChevronRight, Copy, Check } from 'lucide-react';
import SourceList from '../sources/SourceList';
import SourceDiscovery from '../sources/SourceDiscovery';

export default function Sidebar({
  sources,
  activeCitation,
  onSelectSource,
  onDoubleClickSource,
  onDeleteSource,
  onOpenAddModal,
  discoveryTopic,
  setDiscoveryTopic,
  onImportDiscovery,
  isCollapsed,
  onToggleCollapse,
  inspectingSource,
  setInspectingSource,
  onExplainSource
}) {
  const [searchInput, setSearchInput] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = inspectingSource?.content || inspectingSource?.Content || inspectingSource?.text || inspectingSource?.Text || inspectingSource?.snippet || inspectingSource?.Snippet || inspectingSource?.description || inspectingSource?.Description;
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && inspectingSource) {
        setInspectingSource(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [inspectingSource, setInspectingSource]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setDiscoveryTopic(searchInput.trim());
    setSearchInput('');
  };

  if (isCollapsed) {
    return <aside className="sidebar sources-panel collapsed-hidden-panel" style={{ display: 'none' }} />;
  }

  return (
    <aside className="sidebar sources-panel">
      {inspectingSource ? (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Header */}
          <div className="sidebar-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '12px', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span className="source-index">[{inspectingSource.index || 1}]</span>
              <h3 className="sidebar-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.88rem' }}>
                Source View
              </h3>
            </div>
            <button 
              onClick={() => setInspectingSource(null)} 
              title="Close Source View"
              style={{ background: 'transparent', border: 'none', color: 'var(--dim)', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 4px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#e3e4e8', lineHeight: '1.4', wordBreak: 'break-word' }}>
              {inspectingSource.title || 'Untitled Source'}
            </div>

            {inspectingSource.url && (
              <div className="drawer-url-card" style={{ padding: '8px 12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <div className="drawer-url-info" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#8b8d97', minWidth: 0 }}>
                  <Globe size={12} className="globe-icon" style={{ flexShrink: 0 }} />
                  <span className="drawer-url-domain" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {(() => {
                      try {
                        return new URL(inspectingSource.url).hostname.replace('www.', '');
                      } catch {
                        return inspectingSource.url;
                      }
                    })()}
                  </span>
                </div>
                <a href={inspectingSource.url} target="_blank" rel="noreferrer" className="drawer-external-link" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '4px', color: '#3b82f6', textDecoration: 'none', fontWeight: '600' }}>
                  <span>Visit</span>
                  <ChevronRight size={12} />
                </a>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              {onExplainSource && (
                <button
                  onClick={() => onExplainSource(inspectingSource)}
                  title="Ask AI to explain this source in detail"
                  style={{ background: '#3b82f6', color: '#ffffff', border: 'none', display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '600', flex: 1, justifyContent: 'center' }}
                >
                  <Sparkles size={11} />
                  <span>Explain Source</span>
                </button>
              )}
              <button
                className={`drawer-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="Copy raw text to clipboard"
                style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer', padding: '6px 10px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '600', flex: onExplainSource ? 1 : 'none', justifyContent: 'center', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)', color: '#c4c6cd' }}
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="drawer-text-preview-card" style={{ flex: 1, background: '#1b1d22', border: '1px solid rgba(255, 255, 255, 0.04)', borderRadius: '12px', padding: '12px', overflowY: 'auto', fontSize: '0.74rem', color: '#c4c6cd', lineHeight: '1.5', minHeight: '150px' }}>
              {inspectingSource.content || inspectingSource.Content || inspectingSource.text || inspectingSource.Text || inspectingSource.snippet || inspectingSource.Snippet || inspectingSource.description || inspectingSource.Description ? (
                <div className="markdown-content">
                  <ReactMarkdown>
                    {inspectingSource.content || inspectingSource.Content || inspectingSource.text || inspectingSource.Text || inspectingSource.snippet || inspectingSource.Snippet || inspectingSource.description || inspectingSource.Description}
                  </ReactMarkdown>
                </div>
              ) : (
                <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>No content available.</p>
              )}
            </div>
          </div>
        </div>
      ) : discoveryTopic ? (
        <SourceDiscovery 
          query={discoveryTopic}
          onImport={onImportDiscovery}
          onCancel={() => setDiscoveryTopic(null)}
        />
      ) : (
        <>
          {/* Header */}
          <div className="sidebar-header">
            <h3 className="sidebar-title">Sources</h3>
            <button 
              className="panel-toggle-btn" 
              onClick={onToggleCollapse}
              title="Minimize Sources Panel"
            >
              <PanelLeftClose size={16} />
            </button>
          </div>

          <div className="sidebar-content">
            {/* Prominent Add Source Pill Button */}
            <button className="add-sources-pill-btn" onClick={onOpenAddModal}>
              <Plus size={16} />
              <span>Add sources</span>
            </button>

            {/* Quick Web Discovery Input */}
            <form onSubmit={handleSearchSubmit} className="quick-search-box">
              <div className="search-input-wrapper">
                <input 
                  type="text" 
                  placeholder="Search the web for new sources" 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                <div className="search-box-icons">
                  <Globe size={14} className="box-icon" />
                  <Sparkles size={14} className="box-icon" />
                  <button type="submit" className="box-submit-btn" disabled={!searchInput.trim()}>
                    <Search size={14} />
                  </button>
                </div>
              </div>
            </form>

            {/* Sources List */}
            <div className="sources-section">
              <SourceList
                sources={sources}
                activeCitation={activeCitation}
                onSelectSource={onSelectSource}
                onDoubleClickSource={onDoubleClickSource}
                onDeleteSource={onDeleteSource}
              />
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
