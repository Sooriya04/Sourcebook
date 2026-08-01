import React from 'react';
import CitationPill from '../components/chat/CitationPill';

export function parseCitations(text, messageSources, allSources, onCitationClick, activeCitation) {
  if (!text) return null;
  
  const citationRegex = /\[(\d+)\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = citationRegex.exec(text)) !== null) {
    const citeNum = parseInt(match[1], 10);
    const textChunk = text.substring(lastIndex, match.index);
    if (textChunk) parts.push(textChunk);

    const foundSource = (messageSources || []).find(s => s.index === citeNum) 
      || (allSources || []).find(s => s.index === citeNum);

    parts.push(
      <CitationPill
        key={`cite-${match.index}`}
        index={citeNum}
        source={foundSource}
        isActive={activeCitation === citeNum}
        onClick={() => onCitationClick(citeNum, foundSource)}
      />
    );
    lastIndex = citationRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}
