import React from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import SentinelStatus from '../layout/SentinelStatus';

export default function NotebookHeader({ 
  title, 
  notebookId, 
  onExport 
}) {
  return (
    <header className="notebook-header-tasteful">
      <div className="header-left-cluster">
        <Link 
          to="/" 
          className="header-back-button" 
          title="Back to Notebooks Home"
          aria-label="Back to notebooks"
        >
          <ArrowLeft size={15} />
        </Link>
        <h2 className="header-notebook-title">{title}</h2>
        <SentinelStatus notebookId={notebookId} />
      </div>

      <div className="header-right-actions">
        <button 
          type="button"
          className="header-export-btn" 
          onClick={onExport} 
          title="Export entire notebook as Markdown"
        >
          <Download size={13} />
          <span>Export Markdown</span>
        </button>
      </div>
    </header>
  );
}
