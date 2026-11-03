import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import Modal from '../ui/Modal';

export default function CreateNotebookModal({ isOpen, onClose, onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await onCreate(title.trim(), description.trim());
      setTitle('');
      setDescription('');
      onClose();
    } catch (err) {
      console.error('Failed to create notebook:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Notebook"
      description="Initialize an isolated research container for your sources, notes, and grounding."
      maxWidth="500px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="nb-title" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Notebook Title <span style={{ color: 'var(--accent)' }}>*</span>
          </label>
          <input
            id="nb-title"
            type="text"
            className="form-input"
            placeholder="e.g. LLM RAG Architecture & Benchmarks"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div>
          <label htmlFor="nb-desc" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
            Description (Optional)
          </label>
          <textarea
            id="nb-desc"
            className="form-textarea"
            placeholder="Outline goals, key topics, or scope for this research workspace..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-default)' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn-primary"
            disabled={isSubmitting || !title.trim()}
          >
            <Plus size={15} />
            <span>{isSubmitting ? 'Creating...' : 'Create Notebook'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
