import React from 'react';
import { Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

export default function AppShell({ children }) {
  const location = useLocation();
  const isNotebookPage = location.pathname.startsWith('/notebook/');
  const isSettingsPage = location.pathname === '/settings';

  return (
    <div
      className="app-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        backgroundColor: '#09090b', // zinc-950
        color: '#f4f4f5', // zinc-100
        overflow: 'hidden'
      }}
    >
      {!isNotebookPage && (
        <header
          className="top-nav-bar"
          style={{
            height: '56px',
            backgroundColor: 'rgba(9, 9, 11, 0.88)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid #27272a', // zinc-800
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 clamp(16px, 3vw, 32px)',
            zIndex: 30,
            flexShrink: 0
          }}
        >
          {/* Brand Link */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link
              to="/"
              className="brand-link"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                color: '#f4f4f5'
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: '1.15rem',
                  fontWeight: 600,
                  letterSpacing: '-0.025em',
                  color: '#f4f4f5'
                }}
              >
                SourceBook
              </span>
            </Link>

            <span
              style={{
                fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
                fontSize: '0.65rem',
                color: '#71717a', // zinc-500
                backgroundColor: '#18181b', // zinc-900
                border: '1px solid #27272a', // zinc-800
                padding: '2px 6px',
                borderRadius: '4px',
                letterSpacing: '0.04em'
              }}
            >
              LOCAL
            </span>
          </div>

          {/* Right Action Group */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Engine Status */}
            <div
              className="pipeline-status"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                borderRadius: '9999px',
                backgroundColor: '#18181b', // zinc-900
                border: '1px solid #27272a', // zinc-800
                fontFamily: "'IBM Plex Mono', ui-monospace, monospace",
                fontSize: '0.68rem',
                color: '#d4d4d8' // zinc-300
              }}
            >
              <span
                className="status-dot"
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981', // emerald-500
                  boxShadow: '0 0 0 3px rgba(16, 185, 129, 0.2)',
                  animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                }}
              />
              <span>Local Engine Connected</span>
            </div>

            {/* Settings Gear Link */}
            <Link
              to="/settings"
              title="Settings"
              aria-label="Application Settings"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: isSettingsPage ? '#27272a' : 'transparent',
                border: isSettingsPage ? '1px solid #3f3f46' : '1px solid transparent',
                color: isSettingsPage ? '#a5b4fc' : '#71717a',
                transition: 'all 0.15s ease',
                textDecoration: 'none'
              }}
              onMouseEnter={(e) => {
                if (!isSettingsPage) {
                  e.currentTarget.style.color = '#f4f4f5';
                  e.currentTarget.style.backgroundColor = '#27272a';
                  e.currentTarget.style.borderColor = '#3f3f46';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSettingsPage) {
                  e.currentTarget.style.color = '#71717a';
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.borderColor = 'transparent';
                }
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(99, 102, 241, 0.35)';
                e.currentTarget.style.outline = 'none';
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <Settings size={18} />
            </Link>
          </div>
        </header>
      )}

      <main
        className="app-workspace-body"
        style={{
          flex: 1,
          height: isNotebookPage ? '100%' : 'calc(100% - 56px)',
          overflow: 'hidden',
          display: 'flex'
        }}
      >
        {children}
      </main>
    </div>
  );
}
