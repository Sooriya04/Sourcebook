import React from 'react';

export default function CitationPill({ index, source, isActive, onClick }) {
  return (
    <button
      className={`citation-pill ${isActive ? 'active' : ''}`}
      onClick={onClick}
      title={source ? source.title : `Source [${index}]`}
    >
      [{index}]
    </button>
  );
}
