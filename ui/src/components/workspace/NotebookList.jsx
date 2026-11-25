import React from 'react';
import { Layers, Plus, BookOpen } from 'lucide-react';
import NotebookListItem from './NotebookListItem';
import EmptyState from '../ui/EmptyState';

export default function NotebookList({
  notebooks = [],
  archivedIds = [],
  search = '',
  activeView = 'all',
  onSelectNotebook,
  onToggleArchive,
  onDeleteNotebook,
  onNewNotebook,
  onClearFilter
}) {
  if (notebooks.length === 0) {
    if (search) {
      return (
        <div className="notebook-list-empty-container">
          <EmptyState
            icon={Layers}
            title="No matching notebooks"
            description={`No research workspaces found matching "${search}".`}
            action={
              <button
                type="button"
                className="btn-secondary"
                onClick={onClearFilter}
              >
                Clear Search Filter
              </button>
            }
          />
        </div>
      );
    }

    if (activeView === 'archived') {
      return (
        <div className="notebook-list-empty-container">
          <EmptyState
            icon={Layers}
            title="No archived notebooks"
            description="Notebooks you archive will appear here for reference."
          />
        </div>
      );
    }

    return (
      <div className="notebook-list-empty-container">
        <EmptyState
          icon={BookOpen}
          title="Your research workspace is empty"
          description="Create your first notebook to begin querying live web sources, importing documents, and synthesizing grounded insights."
          action={
            <button
              type="button"
              className="btn-primary"
              onClick={onNewNotebook}
            >
              <Plus size={14} />
              <span>Create First Notebook</span>
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div className="notebook-list-container">
      {/* Table-Like Column Header */}
      <div className="notebook-list-header" role="row">
        <div className="col-info">
          <span>Name & Overview</span>
        </div>
        <div className="col-sources">
          <span>Grounding Sources</span>
        </div>
        <div className="col-time">
          <span>Last Updated</span>
        </div>
        <div className="col-actions">
          <span>Actions</span>
        </div>
      </div>

      {/* Row Presentation */}
      <div className="notebook-list-body" role="rowgroup">
        {notebooks.map((nb) => {
          const isArchived = archivedIds.includes(nb.id);
          return (
            <NotebookListItem
              key={nb.id}
              notebook={nb}
              isArchived={isArchived}
              onClick={() => onSelectNotebook(nb)}
              onToggleArchive={onToggleArchive}
              onDelete={onDeleteNotebook}
            />
          );
        })}
      </div>
    </div>
  );
}
