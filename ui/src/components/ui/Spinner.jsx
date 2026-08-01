import React from 'react';

export default function Spinner({ size = 18, color = 'var(--accent-primary)' }) {
  return (
    <div
      className="spinner"
      style={{
        width: size,
        height: size,
        borderColor: `${color} transparent transparent transparent`,
      }}
    />
  );
}
