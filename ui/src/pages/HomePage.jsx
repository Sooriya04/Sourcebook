import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import NotebookCard from '../components/notebook/NotebookCard';
import CreateNotebookModal from '../components/notebook/CreateNotebookModal';

export default function HomePage({ notebooks, onCreateNotebook, onDeleteNotebook }) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredNotebooks = notebooks.filter(nb => 
    nb.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (nb.description && nb.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCreate = (title, desc) => {
    const newNb = onCreateNotebook(title, desc);
    if (newNb?.id) {
      navigate(`/notebook/${newNb.id}`);
    }
  };

  return (
    <div className="home-page-container">
      <div className="home-hero">
        <h1 className="home-headline">Welcome to SourceBook</h1>
        <p className="home-subheadline">
          Local-First NotebookLM + Perplexity hybrid engine. Synthesize web knowledge & documents into grounded AI insights.
        </p>

        <div className="home-search-bar">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="home-search-input"
            placeholder="Search notebooks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="notebooks-grid-section">
        <div className="grid-section-header">
          <span className="section-heading">Recent Notebooks ({filteredNotebooks.length})</span>
        </div>

        <div className="notebooks-grid">
          {/* Card to create new notebook */}
          <div className="create-notebook-card" onClick={() => setIsModalOpen(true)}>
            <div className="create-icon-wrapper">
              <Plus size={28} />
            </div>
            <span className="create-card-title">New Notebook</span>
            <span className="create-card-sub">Start with empty sources or web query</span>
          </div>

          {/* List existing notebooks */}
          {filteredNotebooks.map(nb => (
            <NotebookCard
              key={nb.id}
              notebook={nb}
              onClick={() => navigate(`/notebook/${nb.id}`)}
              onDelete={onDeleteNotebook}
            />
          ))}
        </div>
      </div>

      <CreateNotebookModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
