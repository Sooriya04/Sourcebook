import React from 'react';

export default function MarkdownBadge({ size = 22, className = '' }) {
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: `${size}px`,
        height: `${Math.round(size * 0.72)}px`,
        border: '1.5px solid #1a73e8',
        borderRadius: '3.5px',
        backgroundColor: 'rgba(26, 115, 232, 0.12)',
        padding: '1px 2px',
        boxSizing: 'border-box',
        flexShrink: 0
      }}
      title="Markdown"
    >
      <svg
        viewBox="0 0 24 16"
        fill="none"
        stroke="#4285f4"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ width: '100%', height: '100%' }}
      >
        <path d="M2 13V3l4 5 4-5v10" />
        <path d="M18 3v10M14 9l4 4 4-4" />
      </svg>
    </div>
  );
}
