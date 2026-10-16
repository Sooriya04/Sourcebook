import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = '520px',
  className = ''
}) {
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && onClose) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(9, 9, 11, 0.78)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeIn 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      <div
        className={`modal-content ${className}`}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth,
          backgroundColor: '#18181b', // zinc-900
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '14px',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.75)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'modalZoomIn 0.18s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        <div
          className="modal-header"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #27272a', // zinc-800
            gap: '12px'
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <h3
              className="modal-title"
              style={{
                fontSize: '0.95rem',
                fontWeight: 600,
                color: '#f4f4f5', // zinc-100
                margin: 0,
                letterSpacing: '-0.015em'
              }}
            >
              {title}
            </h3>
            {description && (
              <p
                style={{
                  fontSize: '0.78rem',
                  color: '#a1a1aa', // zinc-400
                  margin: '3px 0 0 0',
                  lineHeight: 1.4
                }}
              >
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: 'transparent',
              border: '1px solid transparent',
              borderRadius: '8px',
              padding: '6px',
              color: '#71717a', // zinc-500
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#f4f4f5';
              e.currentTarget.style.backgroundColor = '#27272a';
              e.currentTarget.style.borderColor = '#3f3f46';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#71717a';
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = 'transparent';
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.4)';
              e.currentTarget.style.outline = 'none';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <X size={16} />
          </button>
        </div>
        <div
          className="modal-body"
          style={{
            padding: '20px',
            overflowY: 'auto',
            maxHeight: 'calc(85vh - 70px)'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
