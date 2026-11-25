import React, { useState, useMemo } from 'react';
import { Search, X } from 'lucide-react';
import DirectoryEmptyState from './DirectoryEmptyState';

export default function ServiceDirectory({
  searchPlaceholder = 'Search integrations...',
  groups = [],
  selectedId,
  onSelectItem,
  activeId,
  getItemStatus
}) {
  const [search, setSearch] = useState('');

  const filteredGroups = useMemo(() => {
    if (!search.trim()) return groups;
    const q = search.toLowerCase();

    return groups
      .map((g) => {
        const matchingItems = g.items.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            (item.desc && item.desc.toLowerCase().includes(q)) ||
            (item.tag && item.tag.toLowerCase().includes(q))
        );
        return {
          ...g,
          items: matchingItems
        };
      })
      .filter((g) => g.items.length > 0);
  }, [groups, search]);

  const totalMatches = filteredGroups.reduce((acc, g) => acc + g.items.length, 0);

  return (
    <aside className="integration-directory" aria-label="Integrations directory">
      {/* Sticky Search Header */}
      <div className="integration-search-header">
        <div className="integration-search-box">
          <Search size={14} className="integration-search-icon" />
          <input
            type="text"
            className="integration-search-input"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label={searchPlaceholder}
          />
          {search && (
            <button
              type="button"
              className="integration-search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable Directory List */}
      <div className="integration-directory-scroll">
        {totalMatches === 0 ? (
          <DirectoryEmptyState query={search} onClear={() => setSearch('')} />
        ) : (
          filteredGroups.map((group) => (
            <div key={group.group} className="integration-group">
              <div className="integration-group-label">{group.group}</div>
              <div className="integration-group-list" role="list">
                {group.items.map((item) => {
                  const isSelected = selectedId === item.id;
                  const isActive = activeId === item.id;
                  const status = getItemStatus ? getItemStatus(item.id) : null;

                  return (
                    <div
                      key={item.id}
                      role="listitem"
                      tabIndex={0}
                      className={`integration-row ${isSelected ? 'selected' : ''}`}
                      onClick={() => onSelectItem(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectItem(item.id);
                        }
                      }}
                    >
                      <div className="integration-row-icon">
                        {item.icon}
                      </div>

                      <div className="integration-row-content">
                        <div className="integration-row-top">
                          <span className="integration-row-name">{item.name}</span>
                          <div className="integration-row-indicators">
                            {status === 'connected' && (
                              <span
                                className="integration-status-dot connected"
                                title="Connected"
                              />
                            )}
                            {status === 'error' && (
                              <span
                                className="integration-status-dot error"
                                title="Connection error"
                              />
                            )}
                            {isActive && (
                              <span className="integration-active-pill" title="Active engine">
                                Active
                              </span>
                            )}
                          </div>
                        </div>
                        {item.desc && (
                          <p className="integration-row-desc">{item.desc}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
