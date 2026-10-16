import React from 'react';
import { Search, X } from 'lucide-react';

export default function NotebookSearchBar({ value, onChange, placeholder = 'Search notebooks...' }) {
  return (
    <div
      className="notebook-search-wrapper"
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        maxWidth: '360px'
      }}
    >
      <Search
        size={15}
        style={{
          position: 'absolute',
          left: '12px',
          color: '#71717a',
          pointerEvents: 'none'
        }}
      />
      <input
        type="text"
        className="notebook-search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: '100%',
          height: '38px',
          padding: '0 34px 0 36px',
          backgroundColor: '#18181b',
          border: '1px solid #27272a',
          borderRadius: '9px',
          color: '#f4f4f5',
          fontSize: '0.84rem',
          outline: 'none',
          transition: 'all 0.15s ease'
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = '#6366f1';
          e.currentTarget.style.backgroundColor = '#1c1c20';
          e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.2)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = '#27272a';
          e.currentTarget.style.backgroundColor = '#18181b';
          e.currentTarget.style.boxShadow = 'none';
        }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          style={{
            position: 'absolute',
            right: '10px',
            background: 'transparent',
            border: 'none',
            color: '#71717a',
            cursor: 'pointer',
            padding: '4px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#f4f4f5';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#71717a';
          }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
