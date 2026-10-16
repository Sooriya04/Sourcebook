import React, { useState } from 'react';
import { Plus, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateNotebookModal from '../components/notebook/CreateNotebookModal';
import NotebookCard from '../components/notebook/NotebookCard';
import CreateNotebookCard from '../components/notebook/CreateNotebookCard';
import FeaturedTemplates from '../components/notebook/FeaturedTemplates';
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

  const handleTemplateSelect = async (template) => {
    try {
      const nb = await onCreateNotebook(template.title, template.description);
      if (nb?.id) navigate(`/notebook/${nb.id}`);
    } catch (err) {
      console.error('Failed to instantiate template notebook:', err);
    }
  };

  return (
    <div
      className="home-page-container"
      style={{
        flex: 1,
        overflowY: 'auto',
        width: '100%',
        backgroundColor: '#09090b',
        color: '#f4f4f5',
        padding: '36px clamp(18px, 4.5vw, 56px)'
      }}
    >
      <div style={{ maxWidth: '1160px', margin: '0 auto' }}>
        {/* Top Header */}
        <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: 'clamp(1.7rem, 3vw, 2.2rem)', fontWeight: 600, letterSpacing: '-0.03em', color: '#f4f4f5', margin: '0 0 6px 0', lineHeight: 1.15 }}>
              SourceBook Studio
            </h1>
            <p style={{ fontSize: '0.9rem', color: '#a1a1aa', margin: 0, lineHeight: 1.5, maxWidth: '560px' }}>
              Personalized AI research assistant grounded in your documents and web sources.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '9px 17px',
              backgroundColor: '#4f46e5', border: '1px solid #6366f1', borderRadius: '9px',
              color: '#ffffff', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 14px -2px rgba(79, 70, 229, 0.4)', transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#4338ca'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#4f46e5'; }}
          >
            <Plus size={16} />
            <span>New notebook</span>
          </button>
        </header>

        {/* Example Notebooks / Featured Templates */}
        <FeaturedTemplates onSelectTemplate={handleTemplateSelect} />

        {/* My Notebooks Section */}
        <section className="notebooks-grid-section">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px',
              marginBottom: '18px',
              paddingBottom: '10px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.06)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f4f4f5', letterSpacing: '-0.01em', margin: 0 }}>
                Recent Notebooks
              </h2>
              <span
                style={{
                  fontSize: '0.7rem',
                  color: '#a1a1aa',
                  backgroundColor: '#18181b',
                  border: '1px solid #27272a',
                  padding: '2px 7px',
                  borderRadius: '9999px',
                  fontWeight: 500
                }}
              >
                {notebooks.length}
              </span>
            </div>

            <NotebookSearchBar value={search} onChange={setSearch} placeholder="Search notebooks..." />
          </div>

          <div
            className="notebooks-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
              gap: '14px'
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
            <div style={{ marginTop: '24px' }}>
              <EmptyState
                icon={Layers}
                title="No matching notebooks"
                description={`No notebooks found matching "${search}". Check your query or clear the filter.`}
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
    </div>
  );
}
