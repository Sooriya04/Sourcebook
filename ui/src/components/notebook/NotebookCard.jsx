import React from 'react';
import { BookOpen, Layers, Trash2 } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';

export default function NotebookCard({ notebook, onClick, onDelete }) {
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
    >
      <div>
        <div className="card-top-row">
          <div className="card-icon-wrapper">
            <BookOpen size={18} />
          </div>
          <button
            type="button"
            className="card-delete-btn"
            title="Delete notebook"
            aria-label="Delete notebook"
            onClick={(e) => {
              e.stopPropagation();
              if (window.confirm(`Delete notebook "${notebook.title || 'Untitled'}"?`)) {
                onDelete?.(notebook.id);
              }
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>

        <h3 className="card-title" title={notebook.title || 'Untitled Notebook'}>
          {notebook.title || 'Untitled Notebook'}
        </h3>

        <p className="card-description">
          {notebook.description || 'No description provided.'}
        </p>
      </div>

      <div className="card-footer">
        <div className="card-source-badge">
          <Layers size={13} />
          <span>{sourceCount} {sourceCount === 1 ? 'source' : 'sources'}</span>
        </div>
        <span>{timeString}</span>
      </div>
    </div>
  );
}
