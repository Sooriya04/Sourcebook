import React from 'react';
import { Check, Globe, Video } from 'lucide-react';

export default function DiscoveryResultCard({ result, isSelected, onToggle, isYouTube }) {
  const isYT = isYouTube(result.url, result.source);

  return (
    <div
      className={`discovery-result-card ${isSelected ? 'selected' : ''}`}
      onClick={() => onToggle(result.url)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle(result.url);
        }
      }}
    >
      <div className="discovery-card-icon">
        {isYT ? <Video size={13} className="text-zinc-400" /> : <Globe size={13} className="text-zinc-400" />}
      </div>
      <div className="discovery-card-details">
        <div className="discovery-card-title">{result.title || 'Untitled Source'}</div>
        {result.snippet && <div className="discovery-card-snippet">{result.snippet}</div>}
      </div>
      <div className={`discovery-custom-checkbox ${isSelected ? 'checked' : ''}`}>
        {isSelected && <Check size={11} strokeWidth={3} />}
      </div>
    </div>
  );
}
