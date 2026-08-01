import React from 'react';
import { BookOpen, Plus, Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function AppShell({ children, onNewNotebook }) {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="app-container">
      <header className="top-nav-bar">
        <div className="nav-left">
          <Link to="/" className="brand-link">
            <div className="brand-logo">
              <BookOpen size={20} color="var(--text-main)" />
            </div>
            <span className="brand-name">SourceBook</span>
            <span className="brand-tag">Local RAG</span>
          </Link>
        </div>

        <div className="nav-right">
          {isHome && (
            <button className="create-nb-nav-btn" onClick={onNewNotebook}>
              <Plus size={16} /> New Notebook
            </button>
          )}
          <div className="pipeline-status">
            <span className="status-dot"></span>
            <span>Local Engine Connected</span>
          </div>
        </div>
      </header>

      <div className="app-workspace-body">{children}</div>
    </div>
  );
}
