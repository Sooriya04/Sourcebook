import React, { useState } from 'react';
import { Plus, PanelLeft, ArrowRight, Globe, Sparkles, ChevronDown } from 'lucide-react';
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
    <aside className="sidebar-tasteful">
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
            <h3 className="sidebar-title-heading">Sources</h3>
            <button 
              type="button"
              className="sidebar-collapse-btn" 
              onClick={onToggleCollapse}
              title="Minimize Sources Panel"
              aria-label="Minimize sources panel"
            >
              <PanelLeft size={18} />
            </button>
          </div>

          <div className="sidebar-inner-content">
            {/* Prominent Add Sources Button */}
            <button 
              type="button" 
              className="sidebar-add-source-btn" 
              onClick={onOpenAddModal}
            >
              <Plus size={16} strokeWidth={2} />
              <span>Add sources</span>
            </button>

            {/* NotebookLM Style Quick Web Search Card */}
            <form onSubmit={handleSearchSubmit} className="sidebar-quick-search-card">
              <input 
                type="text" 
                placeholder="Search the web for new sources" 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              <div className="sidebar-quick-search-bottom">
                <div className="sidebar-search-chips">
                  <div className="sidebar-search-chip">
                    <Globe size={13} />
                    <ChevronDown size={11} />
                  </div>
                  <div className="sidebar-search-chip">
                    <Sparkles size={13} />
                    <ChevronDown size={11} />
                  </div>
                </div>
                <button 
                  type="submit" 
                  className="sidebar-search-arrow-btn" 
                  disabled={!searchInput.trim()}
                  aria-label="Search"
                >
                  <ArrowRight size={16} />
                </button>
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
