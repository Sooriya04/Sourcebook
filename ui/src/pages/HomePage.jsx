import React, { useState } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateNotebookModal from '../components/notebook/CreateNotebookModal';
import NotebookCard from '../components/notebook/NotebookCard';

export default function HomePage({ notebooks, onCreateNotebook, onDeleteNotebook }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const filteredNotebooks = notebooks.filter(nb => 
    nb.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="home-page-container">
      <div className="home-hero">
        <h1 className="home-headline">SourceBook</h1>
        
        <div className="home-search-bar" style={{ marginTop: '30px' }}>
          <Search size={16} className="search-icon" />
          <input 
            type="text" 
            className="home-search-input"
            placeholder="Search notebooks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="notebooks-grid-section">
        <h2 className="grid-section-header" style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '20px' }}>
          Recent notebooks
        </h2>
        <div className="notebooks-grid">
          <div 
            className="create-notebook-card"
            onClick={() => setIsCreateModalOpen(true)}
            style={{ alignItems: 'center', justifyContent: 'center', borderStyle: 'solid', borderColor: 'transparent', background: 'var(--bg-hover)' }}
          >
            <div className="create-icon-wrapper" style={{ background: 'var(--accent-primary)', borderRadius: '50%', padding: '10px', color: '#fff', marginBottom: '8px' }}>
              <Plus size={24} />
            </div>
            <div className="create-card-title">Create new</div>
          </div>

          {filteredNotebooks.map(nb => (
            <NotebookCard 
              key={nb.id}
              notebook={nb}
              onClick={() => navigate(`/notebook/${nb.id}`)}
              onDelete={(e) => {
                e.stopPropagation();
                onDeleteNotebook(nb.id);
              }}
            />
          ))}
        </div>
      </div>

      {isCreateModalOpen && (
        <CreateNotebookModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={(title, desc) => {
            const nb = onCreateNotebook(title, desc);
            setIsCreateModalOpen(false);
            navigate(`/notebook/${nb.id}`);
          }}
        />
      )}
    </div>
  );
}
