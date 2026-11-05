import React, { useState, useRef, useEffect } from 'react';
import { Layers, SlidersHorizontal, Check } from 'lucide-react';
import SourceCard from './SourceCard';

export default function SourceList({
  sources,
  activeCitation,
  scopedSourceIds,
  onToggleScope,
  onToggleAllScope,
  onSelectSource,
  onDoubleClickSource,
  onDeleteSource
}) {
  const [sortBy, setSortBy] = useState('recent'); // 'recent' | 'title' | 'type'
  const [showSortMenu, setShowSortMenu] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowSortMenu(false);
      }
    };
    if (showSortMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showSortMenu]);

  if (!sources || sources.length === 0) {
    return (
      <div className="sources-empty-tasteful">
        <div className="sources-empty-icon-box">
          <Layers size={22} className="text-zinc-500" />
        </div>
        <p className="sources-empty-title">No sources added yet</p>
        <p className="sources-empty-sub">
          Import web pages, drop documents, or discover topics to ground notebook intelligence.
        </p>
      </div>
    );
  }

  const totalCount = sources.length;
  const validScopedCount = sources.filter(s => {
    if (!scopedSourceIds) return true;
    const key = s.id || String(s.index);
    return scopedSourceIds.has(key) || (s.id && scopedSourceIds.has(String(s.index)));
  }).length;
  const scopedCount = scopedSourceIds ? validScopedCount : totalCount;
  const isAllScoped = scopedCount === totalCount && totalCount > 0;

  // Sorted items based on active criteria
  const sortedSources = [...sources].sort((a, b) => {
    if (sortBy === 'title') {
      const titleA = (a.title || '').toLowerCase();
      const titleB = (b.title || '').toLowerCase();
      return titleA.localeCompare(titleB);
    }
    if (sortBy === 'type') {
      const typeA = (a.type || 'web').toLowerCase();
      const typeB = (b.type || 'web').toLowerCase();
      return typeA.localeCompare(typeB);
    }
    // Default 'recent' maintains insertion index / natural order
    return (a.index || 0) - (b.index || 0);
  });

  return (
    <div className="sources-list-container">
      {onToggleAllScope && (
        <div className="sources-scope-header" ref={menuRef}>
          <button
            type="button"
            className="sources-filter-btn"
            onClick={() => setShowSortMenu(prev => !prev)}
            title="Sort sources"
            aria-label="Sort sources"
          >
            <SlidersHorizontal size={15} />
          </button>

          {showSortMenu && (
            <div className="sources-sort-menu">
              <button
                type="button"
                className={`sources-sort-item ${sortBy === 'recent' ? 'active' : ''}`}
                onClick={() => { setSortBy('recent'); setShowSortMenu(false); }}
              >
                <span>Recent</span>
                {sortBy === 'recent' && <Check size={14} />}
              </button>
              <button
                type="button"
                className={`sources-sort-item ${sortBy === 'title' ? 'active' : ''}`}
                onClick={() => { setSortBy('title'); setShowSortMenu(false); }}
              >
                <span>Title</span>
                {sortBy === 'title' && <Check size={14} />}
              </button>
              <button
                type="button"
                className={`sources-sort-item ${sortBy === 'type' ? 'active' : ''}`}
                onClick={() => { setSortBy('type'); setShowSortMenu(false); }}
              >
                <span>Type</span>
                {sortBy === 'type' && <Check size={14} />}
              </button>
            </div>
          )}

          <label className="sources-select-all-label">
            <span>Select all</span>
            <input
              type="checkbox"
              checked={isAllScoped}
              onChange={onToggleAllScope}
              className="sources-select-all-checkbox"
            />
          </label>
        </div>
      )}

      <div className="source-category-cards" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {sortedSources.map((src, idx) => {
          const citationIndex = src.index || (idx + 1);
          const enrichedSource = { ...src, index: citationIndex };
          const sourceKey = enrichedSource.id || String(enrichedSource.index);
          const isScoped = scopedSourceIds
            ? (scopedSourceIds.has(sourceKey) || (enrichedSource.id && scopedSourceIds.has(String(enrichedSource.index))))
            : true;
          return (
            <SourceCard
              key={enrichedSource.id || enrichedSource.index}
              source={enrichedSource}
              isActive={activeCitation === enrichedSource.index}
              isScoped={isScoped}
              onToggleScope={onToggleScope}
              onClick={() => onSelectSource?.(enrichedSource)}
              onDoubleClick={() => onDoubleClickSource?.(enrichedSource)}
              onInspect={onDoubleClickSource}
              onDelete={onDeleteSource}
            />
          );
        })}
      </div>
    </div>
  );
}
