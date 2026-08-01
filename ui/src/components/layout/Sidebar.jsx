import React from 'react';
import { Plus } from 'lucide-react';
import SourceList from '../sources/SourceList';

export default function Sidebar({
  sources,
  activeCitation,
  onSelectSource,
  onDeleteSource,
  onOpenAddModal
}) {
  return (
    <aside className="sidebar">
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
    </aside>
  );
}
