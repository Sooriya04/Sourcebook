import React from 'react';
import { Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function AppShell({ children }) {
  const location = useLocation();
  const isNotebookPage = location.pathname.startsWith('/notebook/');
  const isSettingsPage = location.pathname === '/settings';

  return (
    <div className="app-container">
      {!isNotebookPage && (
        <header className="top-nav-bar">
          <div className="nav-left">
            <Link to="/" className="brand-link">
              <span className="brand-name">SourceBook</span>
            </Link>
            <span className="brand-badge">LOCAL</span>
          </div>

          <div className="nav-right">
            <div className="pipeline-status">
              <span className="status-dot" />
              <span>Local Engine Connected</span>
            </div>

            <Link
              to="/settings"
              title="Settings"
              aria-label="Application Settings"
              className={`nav-btn ${isSettingsPage ? 'active' : ''}`}
            >
              <Settings size={17} />
            </Link>
          </div>
        </header>
      )}

      <main className="app-workspace-body" style={{ height: isNotebookPage ? '100%' : 'calc(100% - 54px)' }}>
        {children}
      </main>
    </div>
  );
}
