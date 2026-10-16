import React from 'react';
import { UploadCloud } from 'lucide-react';

export default function DragDropOverlay({ isDragging }) {
  if (!isDragging) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(9, 9, 11, 0.88)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        border: '2px dashed #6366f1',
        margin: '16px',
        borderRadius: '16px',
        color: '#ffffff',
        pointerEvents: 'none',
        animation: 'fadeIn 0.15s ease'
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '16px',
          backgroundColor: '#18181b',
          border: '1px solid #3f3f46',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#818cf8',
          marginBottom: '16px',
          boxShadow: '0 8px 24px -4px rgba(99, 102, 241, 0.25)'
        }}
      >
        <UploadCloud size={36} />
      </div>

      <h2
        style={{
          fontSize: '1.25rem',
          fontWeight: 600,
          color: '#f4f4f5',
          margin: '0 0 6px 0',
          letterSpacing: '-0.02em'
        }}
      >
        Drop files to ingest into notebook
      </h2>

      <p
        style={{
          fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
          fontSize: '0.78rem',
          color: '#a1a1aa',
          margin: 0
        }}
      >
        Supports PDF, Markdown, Plain Text, and Code
      </p>
    </div>
  );
}
