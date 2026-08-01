import React, { useState } from 'react';
import { Search, Plus } from 'lucide-react';
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
        
        <div className="home-search-bar">
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
        <h2 className="grid-section-header">
          Recent notebooks
        </h2>
        <div className="notebooks-grid">
          <div 
            className="create-notebook-card"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <div className="create-icon-wrapper">
              <Plus size={24} />
            </div>
            <div className="create-card-title">Create new</div>
          </div>

          {filteredNotebooks.map(nb => (
            <NotebookCard 
              key={nb.id}
              notebook={nb}
              onClick={() => navigate(`/notebook/${nb.id}`)}
              onDelete={(id) => {
                onDeleteNotebook(id);
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
