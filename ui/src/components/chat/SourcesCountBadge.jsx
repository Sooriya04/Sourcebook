import React from 'react';
import { Layers } from 'lucide-react';

export default function SourcesCountBadge({ sourceCount = 0, scopedCount }) {
  const isFiltered = scopedCount !== undefined && scopedCount !== sourceCount;
  const badgeText = isFiltered
    ? `${scopedCount}/${sourceCount}`
    : `${sourceCount} ${sourceCount === 1 ? 'source' : 'sources'}`;

  return (
    <div
      title={isFiltered ? `${scopedCount} of ${sourceCount} sources active in chat scope` : `${sourceCount} sources active`}
      style={{
        fontSize: '0.78rem',
        color: '#9ca3af',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexShrink: 0,
        fontWeight: 400
      }}
    >
      <span>{badgeText}</span>
    </div>
  );
}
