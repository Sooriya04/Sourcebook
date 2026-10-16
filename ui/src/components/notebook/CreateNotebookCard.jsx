import React, { useState } from 'react';
import { Plus } from 'lucide-react';

export default function CreateNotebookCard({ onClick }) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      className="create-notebook-card"
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
        border: isHovered
          ? '1px dashed #6366f1'
          : '1px dashed #27272a',
        borderRadius: '14px',
        cursor: 'pointer',
        transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: isHovered
          ? '0 8px 24px -4px rgba(99, 102, 241, 0.15)'
          : 'none',
        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
        outline: 'none',
        boxSizing: 'border-box'
      }}
      onFocus={(e) => {
        e.currentTarget.style.borderColor = '#6366f1';
        e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.3)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.borderColor = '#27272a';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div>
        <div
          className="create-icon-wrapper"
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            backgroundColor: '#27272a',
            border: '1px solid #3f3f46',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isHovered ? '#818cf8' : '#e4e4e7',
            transition: 'color 0.15s ease',
            marginBottom: '14px'
          }}
        >
          <Plus size={19} />
        </div>

        <div
          className="create-card-title"
          style={{
            fontSize: '0.98rem',
            fontWeight: 600,
            color: '#f4f4f5',
            letterSpacing: '-0.015em',
            marginBottom: '6px'
          }}
        >
          New notebook
        </div>

        <p
          style={{
            fontSize: '0.8rem',
            color: '#a1a1aa',
            lineHeight: 1.5,
            margin: 0
          }}
        >
          Initialize a blank workspace with local PDF, text, and real-time web ingestion.
        </p>
      </div>

      <div
        style={{
          fontSize: '0.74rem',
          fontWeight: 500,
          color: isHovered ? '#818cf8' : '#71717a',
          paddingTop: '12px',
          borderTop: '1px solid rgba(255, 255, 255, 0.04)',
          transition: 'color 0.15s ease'
        }}
      >
        + Blank workspace
      </div>
    </div>
  );
}
