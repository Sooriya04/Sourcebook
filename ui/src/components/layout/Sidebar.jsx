import React, { useState } from 'react';
import { Plus, PanelLeftClose, Search, Globe, Sparkles } from 'lucide-react';
import SourceList from '../sources/SourceList';
import SourceDiscovery from '../sources/SourceDiscovery';
import SourceInspector from '../sources/SourceInspector';

export default function Sidebar({
  sources = [],
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
    return null;
  }

  return (
    <aside className="sidebar-tasteful" style={{ width: '300px', flexShrink: 0, height: '100%' }}>
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
        <div className="sidebar-panel-wrapper">
          {/* Header */}
          <div className="sidebar-header-row">
            <div className="sidebar-title-group">
              <h3 className="sidebar-title-heading">Sources</h3>
              <span className="sidebar-count-badge">{sources.length}</span>
            </div>
            <button 
              type="button"
              className="sidebar-collapse-btn" 
              onClick={onToggleCollapse}
              title="Minimize Sources Panel"
              aria-label="Minimize sources panel"
            >
              <PanelLeftClose size={15} />
            </button>
          </div>

          <div className="sidebar-inner-content">
            {/* Prominent Add Sources Button */}
            <button 
              type="button" 
              className="sidebar-add-source-btn" 
              onClick={onOpenAddModal}
            >
              <Plus size={15} strokeWidth={2.5} />
              <span>Add sources</span>
            </button>

            {/* Quick Web Discovery Input */}
            <form onSubmit={handleSearchSubmit} className="sidebar-quick-search-form">
              <div className="sidebar-search-wrapper">
                <input 
                  type="text" 
                  placeholder="Search web for sources..." 
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="sidebar-search-input"
                />
                <div className="sidebar-search-addons">
                  <Globe size={13} className="text-zinc-500" />
                  <Sparkles size={13} className="text-zinc-500" />
                  <button 
                    type="submit" 
                    className="sidebar-search-submit" 
                    disabled={!searchInput.trim()}
                    aria-label="Search web"
                  >
                    <Search size={13} />
                  </button>
                </div>
              </div>
            </form>

            {/* Sources List Section */}
            <div className="sidebar-sources-scroll">
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
        </div>
      )}
    </aside>
  );
}
