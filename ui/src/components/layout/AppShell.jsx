import React, { useState, useEffect } from 'react';
import { Settings, RefreshCw } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function AppShell({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const isNotebookPage = location.pathname.startsWith('/notebook/');
  const isSettingsPage = location.pathname === '/settings';

  const [engineStatus, setEngineStatus] = useState('checking');
  const [isChecking, setIsChecking] = useState(false);

  const checkStatus = async () => {
    setIsChecking(true);
    try {
      // Check the backend server health directly
      const res = await fetch('/health');
      if (res.ok) {
        setEngineStatus('online');
      } else {
        setEngineStatus('offline');
      }
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
      {!isNotebookPage && (
        <header className="top-nav-bar">
          <div className="nav-left">
            <Link to="/" className="brand-link" title="SourceBook Workspace">
              <span className="brand-name font-medium tracking-tight text-[#e3e3e3]">SourceBook</span>
            </Link>
          </div>

          <div className="nav-right">
            {/* Live Engine Status Pill with Check Status button */}
            <div
              className="pipeline-status flex items-center gap-2 rounded-full border border-white/5 bg-[#18191c] px-3.5 py-1 text-xs text-[#c4c7c5] cursor-pointer hover:bg-[#282a2d] transition-all"
              onClick={() => navigate('/settings')}
              title={`Engine: ${isOnline ? 'Active' : 'Offline'}. Click to configure settings`}
            >
              <span
                style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: statusColor, flexShrink: 0 }}
                className={isOnline ? 'shadow-[0_0_8px_rgba(16,185,129,0.5)]' : ''}
              />
              <span className="text-[11px] font-medium font-mono text-[#e3e3e3]">
                {isOnline ? 'Local Engine' : 'Engine Offline'}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  checkStatus();
                }}
                title="Check status"
                className="ml-1 p-0.5 rounded-full hover:bg-white/10 text-[#8e918f] hover:text-white transition-all flex items-center justify-center"
              >
                <RefreshCw size={11} className={isChecking ? 'animate-spin' : ''} />
              </button>
            </div>

            <Link
              to="/settings"
              title="Application Settings"
              aria-label="Application Settings"
              className={`flex h-8 w-8 items-center justify-center rounded-full border border-white/5 bg-[#18191c] text-[#c4c7c5] transition-all hover:bg-[#282a2d] hover:text-white ${
                isSettingsPage ? 'border-white/20 text-white bg-[#282a2d]' : ''
              }`}
            >
              <Settings size={15} />
            </Link>
          </div>
        </header>
      )}

      <main className="app-workspace-body" style={{ height: isNotebookPage ? '100%' : 'calc(100% - 56px)' }}>
        {children}
      </main>
    </div>
  );
}
