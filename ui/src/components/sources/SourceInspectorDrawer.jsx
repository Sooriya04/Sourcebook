import React from 'react';
import { FileText, ExternalLink, X } from 'lucide-react';

export default function SourceInspectorDrawer({ source, onClose }) {
  if (!source) return null;

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-title-group">
            <FileText size={18} color="var(--text-main)" />
            <span className="drawer-title">
              Source [{source.index}]: {source.title}
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          {source.url && (
            <div className="drawer-url-link">
              <ExternalLink size={13} style={{ display: 'inline', marginRight: '5px' }} />
              <a href={source.url} target="_blank" rel="noreferrer">
                {source.url}
              </a>
            </div>
          )}

          <div className="drawer-text-preview">
            {source.text || source.snippet || (
              <p style={{ color: 'var(--text-muted)' }}>
                This source was ingested into SourceBook RAG pipeline for grounded synthesis with numerical citations `[{source.index}]`.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
