import React from 'react';
import { Trash2 } from 'lucide-react';
import Modal from '../ui/Modal';

export default function DeleteNotebookModal({ isOpen, onClose, onConfirm, notebookTitle }) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete notebook"
      maxWidth="440px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <p style={{ fontSize: '0.86rem', color: '#a1a1aa', lineHeight: 1.5, margin: 0 }}>
          Are you sure you want to delete <span style={{ color: '#f4f4f5', fontWeight: 500 }}>"{notebookTitle || 'Untitled'}"</span>? All sources, notes, and chat history inside will be permanently deleted.
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            marginTop: '4px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-default)'
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={onConfirm}
          >
            <Trash2 size={14} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
