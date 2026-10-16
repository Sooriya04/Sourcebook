import React from 'react';
import { ArrowDown } from 'lucide-react';

export default function ScrollBottomButton({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'absolute',
        bottom: '75px',
        right: '28px',
        background: 'rgba(24, 24, 27, 0.95)',
        border: '1px solid #3f3f46',
        borderRadius: '20px',
        padding: '6px 14px',
        color: '#f4f4f5',
        fontSize: '0.74rem',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        cursor: 'pointer',
        zIndex: 30,
        outline: 'none',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#818cf8'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#3f3f46'; }}
    >
      <ArrowDown size={13} />
      <span>Latest response</span>
    </button>
  );
}
