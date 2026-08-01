import React from 'react';
import { Plus } from 'lucide-react';
import SourceList from '../sources/SourceList';
import SourceDiscovery from '../sources/SourceDiscovery';

export default function Sidebar({
  sources,
  activeCitation,
  onSelectSource,
  onDeleteSource,
  onOpenAddModal,
  discoveryTopic,
  setDiscoveryTopic,
  onImportDiscovery
}) {
  return (
    <aside className="sidebar">
      {discoveryTopic ? (
        <SourceDiscovery 
          query={discoveryTopic}
          onImport={onImportDiscovery}
          onCancel={() => setDiscoveryTopic(null)}
        />
      ) : (
        <>
          <div className="sidebar-header">
            <div className="sidebar-title-group">
              <span className="sidebar-title">Sources</span>
              <span className="source-count-badge">{sources.length} Active</span>
            </div>
            <button className="add-source-btn" onClick={onOpenAddModal}>
              <Plus size={14} /> Add Source
            </button>
          </div>

          <div className="sources-section">
            <SourceList
              sources={sources}
              activeCitation={activeCitation}
              onSelectSource={onSelectSource}
              onDeleteSource={onDeleteSource}
            />
          </div>
        </>
      )}
    </aside>
  );
}
