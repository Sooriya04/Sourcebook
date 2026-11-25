import React, { useState, useMemo } from 'react';
import { Search, X, Check } from 'lucide-react';
import Badge from '../../ui/Badge';
import DirectoryEmptyState from './DirectoryEmptyState';

export default function ServiceDirectory({
  searchPlaceholder = 'Search providers...',
  groups = [],
  selectedId,
  onSelectItem,
  activeId
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
    <aside className="settings-directory-panel" aria-label="Services directory">
      {/* Sticky Search Header */}
      <div className="settings-directory-search-wrapper">
        <div className="settings-directory-search-box">
          <Search size={14} className="settings-directory-search-icon" />
          <input
            type="text"
            className="settings-directory-search-input"
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="settings-directory-search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Independently Scrollable Directory Body */}
      <div className="settings-directory-scroll">
        {totalMatches === 0 ? (
          <DirectoryEmptyState query={search} onClear={() => setSearch('')} />
        ) : (
          filteredGroups.map((group) => (
            <div key={group.group} className="settings-directory-group">
              <div className="settings-directory-group-label">{group.group}</div>
              <div className="settings-directory-group-list" role="list">
                {group.items.map((item) => {
                  const isSelected = selectedId === item.id;
                  const isActive = activeId === item.id;

                  return (
                    <div
                      key={item.id}
                      role="listitem"
                      tabIndex={0}
                      className={`settings-directory-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => onSelectItem(item.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectItem(item.id);
                        }
                      }}
                    >
                      <div className="settings-directory-item-left">
                        <div className="settings-directory-item-icon">
                          {item.icon}
                        </div>
                        <div className="settings-directory-item-text">
                          <div className="settings-directory-item-name-line">
                            <span className="settings-directory-item-name">{item.name}</span>
                            {isActive && (
                              <Badge variant="primary" size="sm">
                                Active
                              </Badge>
                            )}
                          </div>
                          {item.desc && (
                            <p className="settings-directory-item-desc">{item.desc}</p>
                          )}
                        </div>
                      </div>

                      <div className="settings-directory-item-right">
                        {isSelected ? (
                          <span className="settings-directory-item-check" title="Selected">
                            <Check size={11} strokeWidth={3} />
                          </span>
                        ) : (
                          item.tag && (
                            <span className="settings-directory-item-tag">{item.tag}</span>
                          )
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
