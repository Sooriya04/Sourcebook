import React from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export default function Toast({ message, type = 'info', onClose }) {
  if (!message) return null;

  const config = {
    success: {
      icon: <CheckCircle2 size={15} color="#10b981" />,
      border: '1px solid rgba(16, 185, 129, 0.35)',
      badge: 'SUCCESS'
    },
    error: {
      icon: <AlertCircle size={15} color="#ef4444" />,
      border: '1px solid rgba(239, 68, 68, 0.35)',
      badge: 'ERROR'
    },
    warning: {
      icon: <AlertTriangle size={15} color="#f59e0b" />,
      border: '1px solid rgba(245, 158, 11, 0.35)',
      badge: 'NOTICE'
    },
    info: {
      icon: <Info size={15} color="#6366f1" />,
      border: '1px solid rgba(99, 102, 241, 0.35)',
      badge: 'INFO'
    }
  };

  const current = config[type] || config.info;

  return (
    <div
      className={`toast-notification toast-${type}`}
      role="status"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        backgroundColor: 'rgba(24, 24, 27, 0.96)', // zinc-900
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: current.border,
        borderRadius: '10px',
        padding: '10px 14px',
        color: '#f4f4f5', // zinc-100
        boxShadow: '0 12px 28px -6px rgba(0, 0, 0, 0.65)',
        fontSize: '0.82rem',
        maxWidth: '400px',
        animation: 'toastSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        {current.icon}
      </div>
      <span
        className="toast-message"
        style={{
          flex: 1,
          lineHeight: 1.45,
          color: '#e4e4e7', // zinc-200
          fontWeight: 450
        }}
      >
        {message}
      </span>
      {onClose && (
        <button
          type="button"
          className="toast-close-btn"
          onClick={onClose}
          aria-label="Dismiss notification"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#71717a',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            borderRadius: '6px',
            transition: 'color 0.15s ease, background-color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#f4f4f5';
            e.currentTarget.style.backgroundColor = '#27272a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#71717a';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <X size={13} />
        </button>
      )}
    </div>
  );
}
