import React from 'react';
import { Layers, Globe, PlayCircle, FileText, GitBranch, BookOpen, MessageSquare } from 'lucide-react';
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
      <div className="sources-empty">
        <Layers size={32} style={{ margin: '0 auto 10px auto', opacity: 0.4 }} />
        <p>No active sources yet.</p>
        <p className="empty-sub">Add a web URL, PDF, or query the internet to ingest knowledge.</p>
      </div>
    );
  }

  const totalCount = sources.length;
  const validScopedCount = sources.filter(s => scopedSourceIds ? (scopedSourceIds.has(s.id || String(s.index)) || (s.id && scopedSourceIds.has(String(s.index)))) : true).length;
  const scopedCount = scopedSourceIds ? validScopedCount : totalCount;
  const isAllScoped = scopedCount === totalCount && totalCount > 0;

  // Categorize sources
  const categories = {
    YouTube: { icon: <PlayCircle size={14} color="#ff0000" />, items: [] },
    GitHub: { icon: <GitBranch size={14} color="#facc15" />, items: [] },
    Arxiv: { icon: <BookOpen size={14} color="#f59e0b" />, items: [] },
    Reddit: { icon: <MessageSquare size={14} color="#ff4500" />, items: [] },
    PDF: { icon: <FileText size={14} color="#3b82f6" />, items: [] },
    Web: { icon: <Globe size={14} color="#10b981" />, items: [] },
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
    <div className="sources-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {onToggleAllScope && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px 6px 4px', borderBottom: '1px solid var(--border-color)' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
            <input
              type="checkbox"
              checked={isAllScoped}
              onChange={onToggleAllScope}
              style={{ cursor: 'pointer', accentColor: 'var(--accent-primary)', margin: 0, width: '13px', height: '13px' }}
            />
            <span>Select all ({scopedCount}/{totalCount})</span>
          </label>
          {scopedCount < totalCount && (
            <span style={{ fontSize: '0.68rem', color: 'var(--amber)', fontWeight: 500 }}>
              {totalCount - scopedCount} excluded
            </span>
          )}
        </div>
      )}

      {Object.entries(categories).map(([name, category]) => {
        if (category.items.length === 0) return null;
        
        return (
          <div key={name} className="source-category-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', padding: '0 8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {category.icon}
              <span>{name} ({category.items.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {category.items.map(enrichedSource => {
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
                    onClick={() => onSelectSource(enrichedSource)}
                    onDoubleClick={() => onDoubleClickSource(enrichedSource)}
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
