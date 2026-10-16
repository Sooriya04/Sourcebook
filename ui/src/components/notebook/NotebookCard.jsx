import React, { useState } from 'react';
import { BookOpen, Layers, Trash2 } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';

export default function NotebookCard({ notebook, onClick, onDelete }) {
  const [isHovered, setIsHovered] = useState(false);
  const sourceCount = (notebook.sources || []).length;
  const timeString = formatRelativeTime(notebook.updatedAt || notebook.createdAt);

  return (
    <div
      role="button"
      tabIndex={0}
      className="notebook-card"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '176px',
        padding: '20px',
        backgroundColor: isHovered ? '#1c1c20' : '#18181b',
        border: isHovered ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        cursor: 'pointer',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered ? '0 8px 24px -4px rgba(0, 0, 0, 0.5)' : 'none',
        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        outline: 'none',
        boxSizing: 'border-box'
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#6366f1';
        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.3)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#27272a',
              border: '1px solid #3f3f46',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#a5b4fc',
              flexShrink: 0
            }}
          >
            <BookOpen size={18} />
          </div>

          {onDelete && (
            <button
              type="button"
              className="nb-delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notebook.id);
              }}
              aria-label={`Delete ${notebook.title}`}
              title="Delete notebook"
              style={{
                background: 'transparent',
                border: 'none',
                borderRadius: '6px',
                padding: '6px',
                color: isHovered ? '#71717a' : 'transparent',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#f43f5e';
                e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.14)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#71717a';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>

        <h3
          style={{
            fontSize: '0.96rem',
            fontWeight: 600,
            color: '#f4f4f5',
            letterSpacing: '-0.015em',
            margin: '0 0 6px 0',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {notebook.title}
        </h3>

        <p
          style={{
            fontSize: '0.8rem',
            color: '#a1a1aa',
            lineHeight: 1.5,
            margin: 0,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}
        >
          {notebook.description || 'Custom local intelligence notebook.'}
        </p>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: '12px',
          marginTop: '14px',
          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
          fontSize: '0.72rem'
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: '#202024',
            border: '1px solid #2e2e33',
            color: '#d4d4d8',
            padding: '2px 8px',
            borderRadius: '5px',
            fontWeight: 500
          }}
        >
          <Layers size={11} style={{ color: '#818cf8' }} />
          {sourceCount} {sourceCount === 1 ? 'source' : 'sources'}
        </span>

        <span style={{ color: '#71717a', fontSize: '0.72rem' }}>
          {timeString}
        </span>
      </div>
    </div>
  );
}
