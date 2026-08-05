import React from 'react';
import { Layers, Globe, PlayCircle, FileText, GitBranch, BookOpen, MessageSquare } from 'lucide-react';
import SourceCard from './SourceCard';

export default function SourceList({
  sources,
  activeCitation,
  onSelectSource,
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
    <div className="sources-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {Object.entries(categories).map(([name, category]) => {
        if (category.items.length === 0) return null;
        
        return (
          <div key={name} className="source-category-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', padding: '0 8px', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {category.icon}
              <span>{name} ({category.items.length})</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {category.items.map(enrichedSource => (
                <SourceCard
                  key={enrichedSource.id || enrichedSource.index}
                  source={enrichedSource}
                  isActive={activeCitation === enrichedSource.index}
                  onClick={() => onSelectSource(enrichedSource)}
                  onDelete={onDeleteSource}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
