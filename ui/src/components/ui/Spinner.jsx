import React from 'react';

export default function Spinner({
  size = 18,
  color = '#6366f1', // restrained indigo
  trackColor = '#27272a', // zinc-800
  className = '',
  style = {}
}) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={`spinner ${className}`}
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `2px solid ${trackColor}`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.65s linear infinite',
        flexShrink: 0,
        ...style
      }}
    />
  );
}
