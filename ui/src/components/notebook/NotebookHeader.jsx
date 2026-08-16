import React from 'react';
import { ArrowLeft, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import SentinelStatus from '../layout/SentinelStatus';

export default function NotebookHeader({ title, onClearChat, messageCount, activeMode, setActiveMode, onExport }) {
  return (
    <div className="notebook-header">
      <div className="header-left">
        <Link to="/" className="back-link" title="Back to Notebooks Home">
          <ArrowLeft size={16} />
        </Link>
        <h2 className="current-notebook-title">{title}</h2>
        <SentinelStatus />
      </div>

      <div className="header-actions">
        <button 
          className="clear-chat-btn" 
          onClick={onExport} 
          title="Export entire notebook as Markdown"
          style={{ background: '#1b1d22', color: '#c4c6cd', border: '1px solid rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Download size={14} /> Export Markdown
        </button>
      </div>
    </div>
  );
}
