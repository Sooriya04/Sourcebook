import React from 'react';
import { Layers, Globe, Video, FileText, GitBranch, BookOpen, MessageSquare } from 'lucide-react';
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

  const categories = {
    YouTube: { icon: <Video size={13} className="text-zinc-400" />, items: [] },
    GitHub: { icon: <GitBranch size={13} className="text-zinc-400" />, items: [] },
    Arxiv: { icon: <BookOpen size={13} className="text-zinc-400" />, items: [] },
    Reddit: { icon: <MessageSquare size={13} className="text-zinc-400" />, items: [] },
    PDF: { icon: <FileText size={13} className="text-zinc-400" />, items: [] },
    Web: { icon: <Globe size={13} className="text-zinc-400" />, items: [] },
  };

  sources.forEach((src, idx) => {
    const citationIndex = src.index || (idx + 1);
    const enrichedSource = { ...src, index: citationIndex };
    const url = (src.url || '').toLowerCase();

    if (url.includes('youtube.com') || url.includes('youtu.be') || src.type === 'youtube') {
      categories.YouTube.items.push(enrichedSource);
    } else if (url.includes('github.com')) {
      categories.GitHub.items.push(enrichedSource);
    } else if (url.includes('arxiv.org')) {
      categories.Arxiv.items.push(enrichedSource);
    } else if (url.includes('reddit.com')) {
      categories.Reddit.items.push(enrichedSource);
    } else if (src.type === 'pdf' || url.endsWith('.pdf')) {
      categories.PDF.items.push(enrichedSource);
    } else {
      categories.Web.items.push(enrichedSource);
    }
  });

  return (
    <div className="sources-list-container">
      {onToggleAllScope && (
        <div className="sources-scope-header">
          <label className="sources-select-all-label">
            <input
              type="checkbox"
              checked={isAllScoped}
              onChange={onToggleAllScope}
              className="sources-select-all-checkbox"
            />
            <span>Select all ({scopedCount}/{totalCount})</span>
          </label>
          {scopedCount < totalCount && (
            <span className="sources-excluded-pill">
              {totalCount - scopedCount} excluded
            </span>
          )}
        </div>
      )}

      {Object.entries(categories).map(([name, category]) => {
        if (category.items.length === 0) return null;

        return (
          <div key={name} className="source-category-section">
            <div className="source-category-header">
              <span className="source-category-icon">{category.icon}</span>
              <span className="source-category-name">{name}</span>
              <span className="source-category-count">{category.items.length}</span>
            </div>

            <div className="source-category-cards">
              {category.items.map((enrichedSource) => {
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
      })}
    </div>
  );
}
