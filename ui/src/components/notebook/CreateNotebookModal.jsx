import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { Plus } from 'lucide-react';

export default function CreateNotebookModal({ isOpen, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreate(title, description);
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Notebook">
      <form onSubmit={handleSubmit} className="modal-form">
        <div className="form-group">
          <label className="form-label">Notebook Title *</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. LLM RAG Architecture & Benchmarks"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description (Optional)</label>
          <textarea
            className="form-textarea"
            placeholder="What is this notebook about?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="modal-form-actions">
          <button type="button" className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="submit-btn">
            <Plus size={16} /> Create Notebook
          </button>
        </div>
      </form>
    </Modal>
  );
}
