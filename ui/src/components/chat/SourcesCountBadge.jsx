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
        background: 'rgba(255, 255, 255, 0.06)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '4px 10px',
        borderRadius: '9999px',
        fontSize: '0.74rem',
        color: '#d4d4d8',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        flexShrink: 0,
      }}
    >
      <Layers size={13} color="#818cf8" />
      <span style={{ fontWeight: 500 }}>{badgeText}</span>
    </div>
  );
}
