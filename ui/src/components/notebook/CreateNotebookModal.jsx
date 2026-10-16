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
          <label
            htmlFor="nb-title"
            style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 500,
              color: '#d4d4d8', // zinc-300
              marginBottom: '6px'
            }}
          >
            Notebook Title <span style={{ color: '#818cf8' }}>*</span>
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
            style={{
              width: '100%',
              backgroundColor: '#09090b', // zinc-950
              border: '1px solid #27272a', // zinc-800
              borderRadius: '9px',
              padding: '10px 14px',
              color: '#f4f4f5', // zinc-100
              fontSize: '0.88rem',
              outline: 'none',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.25)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#27272a';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        <div>
          <label
            htmlFor="nb-desc"
            style={{
              display: 'block',
              fontSize: '0.78rem',
              fontWeight: 500,
              color: '#a1a1aa', // zinc-400
              marginBottom: '6px'
            }}
          >
            Description (Optional)
          </label>
          <textarea
            id="nb-desc"
            className="form-textarea"
            placeholder="Outline goals, key topics, or scope for this research workspace..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            style={{
              width: '100%',
              backgroundColor: '#09090b', // zinc-950
              border: '1px solid #27272a', // zinc-800
              borderRadius: '9px',
              padding: '10px 14px',
              color: '#f4f4f5', // zinc-100
              fontSize: '0.86rem',
              lineHeight: 1.5,
              outline: 'none',
              resize: 'none',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#6366f1';
              e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.25)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#27272a';
              e.currentTarget.style.boxShadow = 'none';
            }}
          />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '8px',
            paddingTop: '16px',
            borderTop: '1px solid #27272a'
          }}
        >
          <button
            type="button"
            className="cancel-btn"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              padding: '8px 16px',
              backgroundColor: '#27272a', // zinc-800
              border: '1px solid #3f3f46', // zinc-700
              borderRadius: '8px',
              color: '#d4d4d8', // zinc-300
              fontSize: '0.82rem',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#3f3f46';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#27272a';
              e.currentTarget.style.color = '#d4d4d8';
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting || !title.trim()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 18px',
              backgroundColor: '#4f46e5', // restrained indigo accent
              border: '1px solid #6366f1',
              borderRadius: '8px',
              color: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 600,
              cursor: isSubmitting || !title.trim() ? 'not-allowed' : 'pointer',
              opacity: isSubmitting || !title.trim() ? 0.6 : 1,
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting && title.trim()) {
                e.currentTarget.style.backgroundColor = '#4338ca';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#4f46e5';
            }}
          >
            <Plus size={15} />
            {isSubmitting ? 'Creating...' : 'Create Notebook'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
