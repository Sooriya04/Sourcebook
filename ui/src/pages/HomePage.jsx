import React, { useState } from 'react';
import { Plus, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateNotebookModal from '../components/notebook/CreateNotebookModal';
import NotebookCard from '../components/notebook/NotebookCard';
import CreateNotebookCard from '../components/notebook/CreateNotebookCard';
import NotebookSearchBar from '../components/notebook/NotebookSearchBar';
import EmptyState from '../components/ui/EmptyState';

export default function HomePage({ notebooks = [], onCreateNotebook, onDeleteNotebook }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filteredNotebooks = notebooks.filter((nb) =>
    (nb.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (nb.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="home-page-container">
      <div style={{ maxWidth: '1120px', margin: '0 auto', padding: '40px 24px 64px' }}>
        {/* Clean, Tasteful Header */}
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 600, letterSpacing: '-0.025em', color: '#f4f4f5', margin: '0 0 4px 0' }}>
              Notebooks
            </h1>
            <p style={{ fontSize: '0.84rem', color: '#71717a', margin: 0 }}>
              {notebooks.length} {notebooks.length === 1 ? 'notebook' : 'notebooks'} in your workspace
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <NotebookSearchBar value={search} onChange={setSearch} placeholder="Search notebooks..." />
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 16px',
                backgroundColor: '#4f46e5',
                border: '1px solid #6366f1',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4338ca'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#4f46e5'; }}
            >
              <Plus size={15} />
              <span>New notebook</span>
            </button>
          </div>
        </header>

        {/* Notebooks Grid */}
        <section>
          <div
            className="notebooks-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px'
            }}
          >
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
            <div style={{ marginTop: '32px' }}>
              <EmptyState
                icon={Layers}
                title="No matching notebooks"
                description={`No notebooks found matching "${search}".`}
                action={
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    style={{
                      padding: '7px 14px',
                      backgroundColor: '#27272a',
                      border: '1px solid #3f3f46',
                      borderRadius: '7px',
                      color: '#f4f4f5',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Clear Search
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
    </div>
  );
}
