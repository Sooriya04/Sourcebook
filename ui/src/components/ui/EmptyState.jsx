import React from 'react';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  compact = false
}) {
  return (
    <div
      className={`empty-state ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: compact ? '24px 16px' : '40px 24px',
        backgroundColor: 'rgba(24, 24, 27, 0.4)', // zinc-900/40
        border: '1px dashed #27272a', // zinc-800
        borderRadius: '12px',
        color: '#a1a1aa' // zinc-400
      }}
    >
      {Icon && (
        <div
          style={{
            width: compact ? '36px' : '44px',
            height: compact ? '36px' : '44px',
            borderRadius: '10px',
            backgroundColor: '#27272a', // zinc-800
            border: '1px solid #3f3f46', // zinc-700
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#71717a', // zinc-500
            marginBottom: compact ? '10px' : '14px'
          }}
        >
          <Icon size={compact ? 18 : 22} />
        </div>
      )}
      {title && (
        <h4
          className="empty-title"
          style={{
            fontSize: compact ? '0.86rem' : '0.94rem',
            fontWeight: 600,
            color: '#f4f4f5', // zinc-100
            margin: '0 0 6px 0',
            letterSpacing: '-0.01em'
          }}
        >
          {title}
        </h4>
      )}
      {description && (
        <p
          className="empty-description"
          style={{
            fontSize: compact ? '0.74rem' : '0.8rem',
            color: '#71717a', // zinc-500
            maxWidth: '360px',
            lineHeight: 1.5,
            margin: 0
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <div
          className="empty-action"
          style={{ marginTop: compact ? '12px' : '16px' }}
        >
          {action}
        </div>
      )}
    </div>
  );
}
