import React from 'react';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotebookHeader({ title, onClearChat, messageCount, activeMode, setActiveMode }) {
  return (
    <div className="notebook-header">
      <div className="header-left">
        <Link to="/" className="back-link" title="Back to Notebooks Home">
          <ArrowLeft size={16} />
        </Link>
        <h2 className="current-notebook-title">{title}</h2>
      </div>



      <div className="header-actions">
        {messageCount > 0 && activeMode === 'chat' && (
          <button className="clear-chat-btn" onClick={onClearChat}>
            <Trash2 size={14} /> Clear Timeline
          </button>
        )}
      </div>
    </div>
  );
}
