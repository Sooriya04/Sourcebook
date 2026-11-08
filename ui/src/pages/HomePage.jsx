import React, { useState } from 'react';
import { Plus, Layers, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateNotebookModal from '../components/notebook/CreateNotebookModal';
import CreateYouTubeNotebookModal from '../components/notebook/CreateYouTubeNotebookModal';
import NotebookCard from '../components/notebook/NotebookCard';
import CreateNotebookCard from '../components/notebook/CreateNotebookCard';
import NotebookSearchBar from '../components/notebook/NotebookSearchBar';
import EmptyState from '../components/ui/EmptyState';

export default function HomePage({ notebooks = [], onCreateNotebook, onDeleteNotebook }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isYouTubeModalOpen, setIsYouTubeModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filteredNotebooks = notebooks.filter((nb) =>
    (nb.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (nb.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="home-page-container">
      <div className="home-content-wrapper">
        <header className="home-header">
          <div className="home-title-group">
            <h1 className="text-xl font-medium tracking-tight text-[#e3e3e3]">Notebooks</h1>
            <p className="text-xs font-normal text-[#8e918f]">
              {notebooks.length} {notebooks.length === 1 ? 'workspace' : 'workspaces'} connected locally
            </p>
          </div>

          <div className="home-actions-group">
            <NotebookSearchBar value={search} onChange={setSearch} placeholder="Filter workspaces..." />
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsYouTubeModalOpen(true)}
              title="Chat directly with any YouTube video"
            >
              <Video size={14} className="text-accent" />
              <span>Chat with YouTube</span>
            </button>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <Plus size={14} strokeWidth={2.2} />
              <span>New notebook</span>
            </button>
          </div>
        </header>

        <section>
          <div className="notebooks-grid">
            <CreateNotebookCard onClick={() => setIsCreateModalOpen(true)} />

            {filteredNotebooks.map((nb) => (
              <NotebookCard
                key={nb.id}
                notebook={nb}
                onClick={() => navigate(`/notebook/${nb.id}`)}
                onDelete={(id) => onDeleteNotebook(id)}
              />
            ))}
          </div>

          {filteredNotebooks.length === 0 && search && (
            <div style={{ marginTop: '36px' }}>
              <EmptyState
                icon={Layers}
                title="No matching notebooks"
                description={`No notebook workspaces found matching "${search}".`}
                action={
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setSearch('')}
                  >
                    Clear Filter
                  </button>
                }
              />
            </div>
          )}
        </section>
      </div>

      {isCreateModalOpen && (
        <CreateNotebookModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={async (title, desc) => {
            const nb = await onCreateNotebook(title, desc);
            setIsCreateModalOpen(false);
            if (nb?.id) navigate(`/notebook/${nb.id}`);
          }}
        />
      )}

      {isYouTubeModalOpen && (
        <CreateYouTubeNotebookModal
          isOpen={isYouTubeModalOpen}
          onClose={() => setIsYouTubeModalOpen(false)}
          onOpenChat={(videoId, title) => {
            setIsYouTubeModalOpen(false);
            const query = title ? `?title=${encodeURIComponent(title)}` : '';
            navigate(`/youtube/${videoId}${query}`);
          }}
        />
      )}
    </div>
  );
}
