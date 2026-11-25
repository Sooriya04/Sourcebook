import React from 'react';
import { Search, X, Plus, Video, SlidersHorizontal, ArrowUpDown } from 'lucide-react';

export default function WorkspaceToolbar({
  search,
  onSearchChange,
  activeView,
  onSelectView,
  sortBy,
  onSortChange,
  onNewNotebook,
  onOpenYouTube,
  counts = { all: 0, recent: 0, archived: 0 }
}) {
  return (
    <div className="workspace-toolbar">
      {/* Left: Search & Filter Input */}
      <div className="workspace-search-box">
        <Search size={14} className="workspace-search-icon" />
        <input
          type="text"
          className="workspace-search-input"
          placeholder="Filter research notebooks..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        {search && (
          <button
            type="button"
            className="workspace-search-clear"
            onClick={() => onSearchChange('')}
            aria-label="Clear filter"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Center: View Filter Tabs */}
      <div className="workspace-view-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'all'}
          className={`workspace-view-tab ${activeView === 'all' ? 'active' : ''}`}
          onClick={() => onSelectView('all')}
        >
          <span>All</span>
          <span className="tab-badge">{counts.all}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'recent'}
          className={`workspace-view-tab ${activeView === 'recent' ? 'active' : ''}`}
          onClick={() => onSelectView('recent')}
        >
          <span>Recent</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeView === 'archived'}
          className={`workspace-view-tab ${activeView === 'archived' ? 'active' : ''}`}
          onClick={() => onSelectView('archived')}
        >
          <span>Archived</span>
          {counts.archived > 0 && <span className="tab-badge">{counts.archived}</span>}
        </button>
      </div>

      {/* Right: Sort and Contextual Actions */}
      <div className="workspace-toolbar-actions">
        {/* Sort Selector */}
        <div className="workspace-sort-wrapper">
          <ArrowUpDown size={13} className="workspace-sort-icon" />
          <select
            className="workspace-sort-select"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            aria-label="Sort notebooks"
          >
            <option value="updated">Recently Updated</option>
            <option value="created">Date Created</option>
            <option value="title">Alphabetical (A-Z)</option>
            <option value="sources">Most Sources</option>
          </select>
        </div>

        {/* Chat with YouTube Action */}
        <button
          type="button"
          className="btn-secondary compact"
          onClick={onOpenYouTube}
          title="Chat directly with any YouTube video"
        >
          <Video size={13} className="text-accent" />
          <span>YouTube Chat</span>
        </button>

        {/* Primary New Notebook Action */}
        <button
          type="button"
          className="btn-primary compact"
          onClick={onNewNotebook}
        >
          <Plus size={14} strokeWidth={2.4} />
          <span>New Notebook</span>
        </button>
      </div>
    </div>
  );
}
