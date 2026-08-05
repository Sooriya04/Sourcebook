import React from 'react';
import { BookOpen, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function AppShell({ children }) {
  const location = useLocation();
  const isNotebookPage = location.pathname.startsWith('/notebook/');

  return (
    <div className="app-container">
      {!isNotebookPage && (
        <header className="top-nav-bar">
          <div className="nav-left">
            <Link to="/" className="brand-link">
              <div className="brand-logo">
                <BookOpen size={20} color="var(--text-main)" />
              </div>
              <span className="brand-name">SourceBook</span>
            </Link>
          </div>

          <div className="nav-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="pipeline-status">
              <span className="status-dot"></span>
              <span>Local Engine Connected</span>
            </div>
            <Link to="/settings" title="Settings" style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
              <Settings size={20} />
            </Link>
          </div>
        </header>
      )}

      <div className="app-workspace-body">{children}</div>
    </div>
  );
}
