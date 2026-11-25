import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw, BookOpen } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import GlobalSearch from '../workspace/GlobalSearch';

export default function AppShell({
  children,
  notebooks = [],
  onNewNotebook,
  onOpenYouTube
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const isNotebookPage = location.pathname.startsWith('/notebook/');
  const isYouTubeChatPage = location.pathname.startsWith('/youtube/');
  const isSettingsPage = location.pathname === '/settings';

  const [engineStatus, setEngineStatus] = useState('checking');
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      const res = await fetch('/health');
      setEngineStatus(res.ok ? 'online' : 'offline');
    } catch {
      setEngineStatus('offline');
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (!isNotebookPage) {
      checkStatus();
      const interval = setInterval(checkStatus, 20000);
      return () => clearInterval(interval);
    }
  }, [isNotebookPage]);

  const isOnline = engineStatus === 'online';
  const isPending = engineStatus === 'checking' || isChecking;
  const statusColor = isOnline ? '#10b981' : isPending ? '#f59e0b' : '#ef4444';

  return (
    <div className="app-container">
      {!isNotebookPage && !isYouTubeChatPage && (
        <header className="top-nav-bar">
          <div className="nav-left">
            <Link to="/" className="brand-link" title="SourceBook Workspace">
              <span className="brand-icon-box">
                <BookOpen size={14} />
              </span>
              <span className="brand-name">SourceBook</span>
            </Link>
          </div>

          <div className="nav-center">
            <GlobalSearch
              notebooks={notebooks}
              onNewNotebook={onNewNotebook}
              onOpenYouTube={onOpenYouTube}
            />
          </div>

          <div className="nav-right">
            <div
              className="pipeline-status"
              role="button"
              tabIndex={0}
              onClick={() => navigate('/settings')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate('/settings');
                }
              }}
              title={`Engine: ${isOnline ? 'Online' : 'Offline'}. Click to configure`}
            >
              <span
                className={`pipeline-status-dot ${isOnline ? 'online' : ''}`}
                style={{ backgroundColor: statusColor }}
              />
              <span className="pipeline-status-label">
                {isOnline ? 'Local Engine' : isPending ? 'Checking...' : 'Engine Offline'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  checkStatus();
                }}
                title="Refresh engine status"
                aria-label="Refresh engine status"
                className="pipeline-refresh-btn"
              >
                <RefreshCw size={11} className={isChecking ? 'animate-spin' : ''} />
              </button>
            </div>

            <Link
              to="/settings"
              title="Application Settings"
              aria-label="Application Settings"
              className={`nav-settings-btn ${isSettingsPage ? 'active' : ''}`}
            >
              <Settings size={15} />
            </Link>
          </div>
        </header>
      )}

      <main
        className="app-workspace-body"
        style={{ height: (isNotebookPage || isYouTubeChatPage) ? '100%' : 'calc(100% - 52px)' }}
      >
        {children}
      </main>
    </div>
  );
}
