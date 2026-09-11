import React, { useState } from 'react';
import { Plus, PanelLeftClose, Search, Globe, Sparkles } from 'lucide-react';
import SourceList from '../sources/SourceList';
import SourceDiscovery from '../sources/SourceDiscovery';
import SourceInspector from '../sources/SourceInspector';

export default function Sidebar({
  sources,
  activeCitation,
  scopedSourceIds,
  onToggleScope,
  onToggleAllScope,
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
  onExplainSource,
  onChatWithSource
}) {
  const [searchInput, setSearchInput] = useState('');

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
        <SourceInspector
          source={inspectingSource}
          onClose={() => setInspectingSource(null)}
          onExplainSource={onExplainSource}
          onChatWithSource={onChatWithSource}
        />
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
                scopedSourceIds={scopedSourceIds}
                onToggleScope={onToggleScope}
                onToggleAllScope={onToggleAllScope}
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
