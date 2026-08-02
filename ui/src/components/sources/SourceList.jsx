import React from 'react';
import { Layers } from 'lucide-react';
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

  return (
    <div className="sources-list">
      {sources.map((src, idx) => {
        const citationIndex = src.index || (idx + 1);
        const enrichedSource = { ...src, index: citationIndex };
        return (
          <SourceCard
            key={src.id || citationIndex}
            source={enrichedSource}
            isActive={activeCitation === citationIndex}
            onClick={() => onSelectSource(enrichedSource)}
            onDelete={onDeleteSource}
          />
        );
      })}
    </div>
  );
}
