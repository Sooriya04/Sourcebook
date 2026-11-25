import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateNotebookModal from '../components/notebook/CreateNotebookModal';
import CreateYouTubeNotebookModal from '../components/notebook/CreateYouTubeNotebookModal';
import DeleteNotebookModal from '../components/notebook/DeleteNotebookModal';
import {
  WorkspaceLayout,
  WorkspaceToolbar,
  RecentNotebookSection,
  NotebookList
} from '../components/workspace';

export default function HomePage({
  notebooks = [],
  onCreateNotebook,
  onDeleteNotebook,
  isMobileSidebarOpen = false,
  setIsMobileSidebarOpen,
  isCreateModalOpen: parentCreateModalOpen,
  setIsCreateModalOpen: setParentCreateModalOpen,
  isYouTubeModalOpen: parentYouTubeModalOpen,
  setIsYouTubeModalOpen: setParentYouTubeModalOpen
}) {
  const navigate = useNavigate();

  // Internal modal states with support for parent state overrides
  const [internalCreateOpen, setInternalCreateOpen] = useState(false);
  const [internalYouTubeOpen, setInternalYouTubeOpen] = useState(false);
  const isCreateOpen = parentCreateModalOpen !== undefined ? parentCreateModalOpen : internalCreateOpen;
  const setCreateOpen = setParentCreateModalOpen || setInternalCreateOpen;
  const isYouTubeOpen = parentYouTubeModalOpen !== undefined ? parentYouTubeModalOpen : internalYouTubeOpen;
  const setYouTubeOpen = setParentYouTubeModalOpen || setInternalYouTubeOpen;

  const [notebookToDelete, setNotebookToDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [activeView, setActiveView] = useState('all'); // 'all' | 'recent' | 'archived'
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

  // Notebook filtering and sorting
  const counts = useMemo(() => {
    const archived = archivedIds.length;
    const all = Math.max(0, notebooks.length - archived);
    return {
      all,
      recent: Math.min(all, 5),
      archived
    };
  }, [notebooks, archivedIds]);

  const filteredNotebooks = useMemo(() => {
    let result = [...notebooks];

    // Filter by view
    if (activeView === 'archived') {
      result = result.filter(nb => archivedIds.includes(nb.id));
    } else {
      result = result.filter(nb => !archivedIds.includes(nb.id));
      if (activeView === 'recent') {
        // Recent view takes the 6 most recent
        result.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
        result = result.slice(0, 8);
      }
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

  // Top 3 recently modified notebooks for the Jump Back In section
  const recentNotebooks = useMemo(() => {
    if (activeView === 'archived' || search.trim()) return [];
    const active = notebooks.filter(nb => !archivedIds.includes(nb.id));
    return [...active]
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
      .slice(0, 3);
  }, [notebooks, activeView, search, archivedIds]);

  return (
    <WorkspaceLayout
      notebooks={notebooks}
      activeView={activeView}
      onSelectView={setActiveView}
      archivedIds={archivedIds}
      onNewNotebook={() => setCreateOpen(true)}
      onOpenYouTube={() => setYouTubeOpen(true)}
      isMobileSidebarOpen={isMobileSidebarOpen}
      onCloseMobileSidebar={() => setIsMobileSidebarOpen?.(false)}
    >
      <div className="workspace-content-inner">
        {/* Workspace Landing Header */}
        <header className="workspace-header">
          <div className="workspace-title-group">
            <h1>Your workspace</h1>
            <p>Continue where your research left off.</p>
          </div>

          <div className="workspace-header-actions">
            <button
              type="button"
              className="btn-secondary compact"
              onClick={() => setYouTubeOpen(true)}
              title="Chat directly with any YouTube video"
            >
              <Video size={14} className="text-accent" />
              <span>Chat with YouTube</span>
            </button>

            <button
              type="button"
              className="btn-primary compact"
              onClick={() => setCreateOpen(true)}
            >
              <Plus size={14} strokeWidth={2.4} />
              <span>New notebook</span>
            </button>
          </div>
        </header>

        {/* Top 3 Recently Active Notebooks */}
        {recentNotebooks.length > 0 && (
          <RecentNotebookSection
            notebooks={recentNotebooks}
            onSelectNotebook={(nb) => navigate(`/notebook/${nb.id}`)}
          />
        )}

        {/* Contextual Toolbar */}
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

        {/* Refined List-Based Notebook Presentation */}
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
    </WorkspaceLayout>
  );
}
