import React from 'react';

const VARIANTS = {
  neutral: {
    bg: '#27272a', // zinc-800
    border: '1px solid #3f3f46', // zinc-700
    color: '#d4d4d8' // zinc-300
  },
  primary: {
    bg: 'rgba(99, 102, 241, 0.12)', // indigo tint
    border: '1px solid rgba(99, 102, 241, 0.3)',
    color: '#a5b4fc' // indigo-300
  },
  success: {
    bg: 'rgba(16, 185, 129, 0.12)', // emerald tint
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#6ee7b7' // emerald-300
  },
  danger: {
    bg: 'rgba(239, 68, 68, 0.12)', // red tint
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#fca5a5' // red-300
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.12)', // amber tint
    border: '1px solid rgba(245, 158, 11, 0.3)',
    color: '#fcd34d' // amber-300
  }
};

export default function Badge({
  children,
  variant = 'neutral',
  size = 'sm',
  dot = false,
  className = '',
  style = {}
}) {
  const current = VARIANTS[variant] || VARIANTS.neutral;
  const isSm = size === 'sm';

  return (
    <span
      className={`badge badge-${variant} ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: isSm ? '2px 7px' : '3px 9px',
        borderRadius: '5px',
        fontSize: isSm ? '0.7rem' : '0.78rem',
        fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
        fontWeight: 500,
        letterSpacing: '0.02em',
        backgroundColor: current.bg,
        border: current.border,
        color: current.color,
        whiteSpace: 'nowrap',
        ...style
      }}
    >
      {dot && (
        <span
          style={{
            width: '5px',
            height: '5px',
            borderRadius: '50%',
            backgroundColor: current.color,
            display: 'inline-block'
          }}
        />
      )}
      {children}
    </span>
  );
}
