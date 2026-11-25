import React from 'react';
import { 
  BookOpen, 
  Layers, 
  Trash2, 
  Archive, 
  ArchiveRestore, 
  ArrowUpRight 
} from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';

export default function NotebookListItem({
  notebook,
  isArchived = false,
  onClick,
  onToggleArchive,
  onDelete
}) {
  const sourceCount = (notebook.sources || []).length;
  const timeString = formatRelativeTime(notebook.updatedAt || notebook.createdAt || notebook.updated_at || notebook.created_at);

  return (
    <div
      role="row"
      tabIndex={0}
      className={`notebook-list-row ${isArchived ? 'archived' : ''}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Column 1: Title & Short Description */}
      <div className="col-info">
        <div className="notebook-row-icon-box">
          <BookOpen size={16} />
        </div>
        <div className="notebook-row-text">
          <div className="notebook-row-title-line">
            <span className="notebook-row-title" title={notebook.title}>
              {notebook.title || 'Untitled Notebook'}
            </span>
            {isArchived && (
              <span className="notebook-archived-tag">Archived</span>
            )}
          </div>
          {notebook.description && (
            <p className="notebook-row-desc">
              {notebook.description}
            </p>
          )}
        </div>
      </div>

      {/* Column 2: Sources Count */}
      <div className="col-sources">
        <span className="source-count-pill">
          <Layers size={12} />
          <span>{sourceCount} {sourceCount === 1 ? 'source' : 'sources'}</span>
        </span>
      </div>

      {/* Column 3: Last Modified */}
      <div className="col-time">
        <span className="notebook-time-text">{timeString}</span>
      </div>

      {/* Column 4: Contextual Actions */}
      <div className="col-actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="row-action-btn"
          title={isArchived ? 'Restore from archive' : 'Archive notebook'}
          aria-label={isArchived ? 'Restore from archive' : 'Archive notebook'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleArchive?.(notebook.id);
          }}
        >
          {isArchived ? <ArchiveRestore size={14} /> : <Archive size={14} />}
        </button>

        <button
          type="button"
          className="row-action-btn danger"
          title="Delete notebook"
          aria-label="Delete notebook"
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.(notebook);
          }}
        >
          <Trash2 size={14} />
        </button>

        <button
          type="button"
          className="row-action-btn open"
          title="Open notebook"
          aria-label="Open notebook"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          <ArrowUpRight size={14} />
        </button>
      </div>
    </div>
  );
}
