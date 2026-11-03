import React from 'react';
import { Plus } from 'lucide-react';

export default function CreateNotebookCard({ onClick }) {
  return (
    <div
      role="button"
      tabIndex={0}
      className="create-notebook-card"
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <div>
        <div className="create-icon-wrapper">
          <Plus size={18} />
        </div>
        <h3 className="create-card-title">New Notebook</h3>
        <p className="create-card-description">
          Initialize a research workspace to ingest sources, run grounded RAG, and generate insights.
        </p>
      </div>

      <div className="create-card-footer">
        <span className="create-card-action">Create workspace &rarr;</span>
      </div>
    </div>
  );
}
