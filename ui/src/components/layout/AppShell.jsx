import React from 'react';
import { BookOpen } from 'lucide-react';
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

          <div className="nav-right">
            <div className="pipeline-status">
              <span className="status-dot"></span>
              <span>Local Engine Connected</span>
            </div>
          </div>
        </header>
      )}

      <div className="app-workspace-body">{children}</div>
    </div>
  );
}
