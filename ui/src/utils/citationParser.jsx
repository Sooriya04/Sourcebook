import React from 'react';
import CitationPill from '../components/chat/CitationPill';

function stripBibliography(text) {
  if (!text) return '';
  
  // 1. Check for standard headers like "References" or "Sources"
  const bibHeaderRegex = /(?:\n+|^)(?:###?\s+)?(?:References|Sources|Bibliography|Sources\s+Used)[:\s*]*(?:\n+|$)/i;
  const headerMatch = text.match(bibHeaderRegex);
  if (headerMatch) {
    return text.substring(0, headerMatch.index).trim();
  }

  // 2. Check for block of bibliography entries (e.g. [1] Title, [2] Title) at the bottom
  const bibEntriesRegex = /(?:\n+)(?:\[\d+\]\s+[^.!?]{10,})(?:\n+\[\d+\]\s+[^.!?]{10,})*$/;
  const entriesMatch = text.match(bibEntriesRegex);
  if (entriesMatch) {
    return text.substring(0, entriesMatch.index).trim();
  }

  return text;
}

export function parseCitations(text, messageSources, allSources, onCitationClick, activeCitation) {
  if (!text) return null;
  
  const cleanText = stripBibliography(text);
  const citationRegex = /\[(\d+)\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = citationRegex.exec(cleanText)) !== null) {
    const citeNum = parseInt(match[1], 10);
    const textChunk = cleanText.substring(lastIndex, match.index);
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

  if (lastIndex < cleanText.length) {
    parts.push(cleanText.substring(lastIndex));
  }

  return parts;
}
