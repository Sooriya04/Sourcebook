import React from 'react';
import ReactMarkdown from 'react-markdown';
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

function stripInlineLinks(text) {
  if (!text) return '';
  // 1. Replace markdown links [text](http...) with just text (ignoring numerical citations like [1])
  let cleaned = text.replace(/\[([^\]]+)\]\((?:https?:\/\/[^\s)]+)(?:\s+"[^"]*")?\)/g, (match, linkText) => {
    if (/^\d+$/.test(linkText)) return `[${linkText}]`;
    return linkText;
  });
  
  // 2. Remove standalone URLs in parentheses like (https://...)
  cleaned = cleaned.replace(/\s*\(\s*https?:\/\/[^\s)]+(?:\s+"[^"]*")?\s*\)/g, '');

  return cleaned;
}

export function parseCitations(text, messageSources, allSources, onCitationClick, activeCitation) {
  if (!text) return null;
  
  const cleanText = stripInlineLinks(stripBibliography(text));
  // Convert [1], [2] to markdown link syntax [1](#cite-1) so ReactMarkdown passes it to custom link renderer
  const markdownWithCites = cleanText.replace(/\[(\d+)\](?!\([^)]+\))/g, '[$1](#cite-$1)');

  return (
    <ReactMarkdown
      components={{
        a: ({ href, children }) => {
          if (href && href.startsWith('#cite-')) {
            const citeNum = parseInt(href.replace('#cite-', ''), 10);
            const foundSource = (messageSources || []).find(s => s.index === citeNum) 
              || (allSources || []).find(s => s.index === citeNum);

            return (
              <CitationPill
                key={`cite-${citeNum}`}
                index={citeNum}
                source={foundSource}
                isActive={activeCitation === citeNum}
                onClick={() => onCitationClick(citeNum, foundSource)}
              />
            );
          }
          return (
            <a href={href} target="_blank" rel="noopener noreferrer">
              {children}
            </a>
          );
        }
      }}
    >
      {markdownWithCites}
    </ReactMarkdown>
  );
}
