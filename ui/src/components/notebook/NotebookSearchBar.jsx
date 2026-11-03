import React from 'react';
import { Search, X } from 'lucide-react';

export default function NotebookSearchBar({ value, onChange, placeholder = 'Search notebooks...' }) {
  return (
    <div className="notebook-search-wrapper">
      <Search size={15} className="notebook-search-icon" />
      <input
        type="text"
        className="notebook-search-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Clear search"
          className="notebook-search-clear"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
