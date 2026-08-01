import React from 'react';
import { BookOpen, Layers, Trash2 } from 'lucide-react';
import { formatDate } from '../../utils/formatters';

export default function NotebookCard({ notebook, onClick, onDelete }) {
  return (
    <div className="notebook-card" onClick={onClick}>
      <div className="notebook-card-top">
        <div className="notebook-icon">
          <BookOpen size={20} />
        </div>
        {onDelete && (
          <button
            className="nb-delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(notebook.id);
            }}
            title="Delete notebook"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      <h3 className="notebook-card-title">{notebook.title}</h3>
      <p className="notebook-card-desc">
        {notebook.description || 'Custom local intelligence notebook.'}
      </p>

      <div className="notebook-card-footer">
        <span className="nb-sources-tag">
          <Layers size={12} style={{ display: 'inline', marginRight: '4px' }} />
          {(notebook.sources || []).length} Sources
        </span>
        <span className="nb-date-tag">{formatDate(notebook.createdAt)}</span>
      </div>
    </div>
  );
}
