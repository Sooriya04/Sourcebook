import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import CreateNotebookModal from '../components/notebook/CreateNotebookModal';
import CreateYouTubeNotebookModal from '../components/notebook/CreateYouTubeNotebookModal';
import DeleteNotebookModal from '../components/notebook/DeleteNotebookModal';
import {
  WorkspaceToolbar,
  NotebookList
} from '../components/workspace';

export default function HomePage({
  notebooks = [],
  onCreateNotebook,
  onDeleteNotebook,
  isCreateModalOpen: parentCreateModalOpen,
  setIsCreateModalOpen: setParentCreateModalOpen,
  isYouTubeModalOpen: parentYouTubeModalOpen,
  setIsYouTubeModalOpen: setParentYouTubeModalOpen
}) {
  const navigate = useNavigate();

  // Modal states with support for parent state overrides
  const [internalCreateOpen, setInternalCreateOpen] = useState(false);
  const [internalYouTubeOpen, setInternalYouTubeOpen] = useState(false);
  const isCreateOpen = parentCreateModalOpen !== undefined ? parentCreateModalOpen : internalCreateOpen;
  const setCreateOpen = setParentCreateModalOpen || setInternalCreateOpen;
  const isYouTubeOpen = parentYouTubeModalOpen !== undefined ? parentYouTubeModalOpen : internalYouTubeOpen;
  const setYouTubeOpen = setParentYouTubeModalOpen || setInternalYouTubeOpen;

  const [notebookToDelete, setNotebookToDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [activeView, setActiveView] = useState('all'); // 'all' | 'archived'
  const [sortBy, setSortBy] = useState('updated'); // 'updated' | 'created' | 'title' | 'sources'

  // Persisted archived notebook IDs
  const [archivedIds, setArchivedIds] = useState(() => {
    try {
      const stored = localStorage.getItem('sourcebook_archived_notebooks');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleToggleArchive = (id) => {
    setArchivedIds((prev) => {
      const next = prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id];
      try {
        localStorage.setItem('sourcebook_archived_notebooks', JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const counts = useMemo(() => {
    const archived = archivedIds.filter(id => notebooks.some(nb => nb.id === id)).length;
    const all = Math.max(0, notebooks.length - archived);
    return {
      all,
      archived,
      total: notebooks.length
    };
  }, [notebooks, archivedIds]);

  const filteredNotebooks = useMemo(() => {
    let result = [...notebooks];

    // Filter by view
    if (activeView === 'archived') {
      result = result.filter(nb => archivedIds.includes(nb.id));
    } else {
      result = result.filter(nb => !archivedIds.includes(nb.id));
    }

    // Filter by search query
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(nb =>
        (nb.title || '').toLowerCase().includes(q) ||
        (nb.description || '').toLowerCase().includes(q)
      );
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sortBy === 'updated') {
        return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
      }
      if (sortBy === 'created') {
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      }
      if (sortBy === 'title') {
        return (a.title || '').localeCompare(b.title || '');
      }
      if (sortBy === 'sources') {
        return (b.sources || []).length - (a.sources || []).length;
      }
      return 0;
    });

    return result;
  }, [notebooks, activeView, search, sortBy, archivedIds]);

  return (
    <div className="workspace-container">
      <main className="workspace-main">
        <div className="workspace-content-inner">
          {/* Single, Restrained Page Heading */}
          <header className="workspace-header">
            <div className="workspace-title-group">
              <h1>Notebooks</h1>
              <p>
                Your research, organized in one place.
                <span className="workspace-header-separator">·</span>
                <span className="workspace-header-count">
                  {counts.total} {counts.total === 1 ? 'notebook' : 'notebooks'}
                </span>
              </p>
            </div>
          </header>

          {/* Unified Toolbar with the SINGLE entry points for New Notebook & YouTube */}
          <WorkspaceToolbar
            search={search}
            onSearchChange={setSearch}
            activeView={activeView}
            onSelectView={setActiveView}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onNewNotebook={() => setCreateOpen(true)}
            onOpenYouTube={() => setYouTubeOpen(true)}
            counts={counts}
          />

          {/* Clean, Non-Duplicated Notebook List */}
          <NotebookList
            notebooks={filteredNotebooks}
            archivedIds={archivedIds}
            search={search}
            activeView={activeView}
            onSelectNotebook={(nb) => navigate(`/notebook/${nb.id}`)}
            onToggleArchive={handleToggleArchive}
            onDeleteNotebook={(nb) => setNotebookToDelete(nb)}
            onNewNotebook={() => setCreateOpen(true)}
            onClearFilter={() => setSearch('')}
          />
        </div>
      </main>

      {/* Creation Modal */}
      {isCreateOpen && (
        <CreateNotebookModal
          isOpen={isCreateOpen}
          onClose={() => setCreateOpen(false)}
          onCreate={async (title, desc) => {
            const nb = await onCreateNotebook(title, desc);
            setCreateOpen(false);
            if (nb?.id) navigate(`/notebook/${nb.id}`);
          }}
        />
      )}

      {/* YouTube Modal */}
      {isYouTubeOpen && (
        <CreateYouTubeNotebookModal
          isOpen={isYouTubeOpen}
          onClose={() => setYouTubeOpen(false)}
          onOpenChat={(videoId, title) => {
            setYouTubeOpen(false);
            const query = title ? `?title=${encodeURIComponent(title)}` : '';
            navigate(`/youtube/${videoId}${query}`);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {notebookToDelete && (
        <DeleteNotebookModal
          isOpen={!!notebookToDelete}
          notebookTitle={notebookToDelete.title}
          onClose={() => setNotebookToDelete(null)}
          onConfirm={() => {
            onDeleteNotebook(notebookToDelete.id);
            setNotebookToDelete(null);
          }}
        />
      )}
    </div>
  );
}
