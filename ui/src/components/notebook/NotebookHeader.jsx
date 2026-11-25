import React, { useState } from 'react';
import {
  Home,
  Plus,
  Settings,
  Download,
  BookOpen,
  Globe,
  Sparkles,
  Keyboard,
  Trash2,
  Check,
  X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import SentinelStatus from '../layout/SentinelStatus';

const MODES = [
  { id: 'notebook', label: 'Sources', icon: <BookOpen size={13} /> },
  { id: 'web', label: 'Web', icon: <Globe size={13} /> },
  { id: 'hybrid', label: 'Hybrid', icon: <Sparkles size={13} /> }
];

export default function NotebookHeader({
  title,
  notebookId,
  onExport,
  mode,
  setMode,
  llmHealth,
  onOpenShortcuts,
  onClearChat,
  onCreateNotebook
}) {
  const navigate = useNavigate();
  const [confirmClear, setConfirmClear] = useState(false);

  const isOnline = llmHealth?.status === 'online';
  const isChecking = llmHealth?.status === 'checking';
  const statusColor = isOnline ? '#10b981' : isChecking ? '#f59e0b' : '#ef4444';
  const modelName = isOnline ? (llmHealth.model?.split('/')?.pop() || 'Online') : isChecking ? 'Checking' : 'Offline';

  return (
    <header className="nb-header">
      {/* LEFT — Notebook Identity */}
      <div className="nb-header-left">
        <Link
          to="/"
          className="nb-home-btn"
          title="Back to Workspace"
          aria-label="Back to Workspace"
        >
          <Home size={15} />
        </Link>

        <h1 className="nb-header-title" title={title}>
          {title || 'Untitled Notebook'}
        </h1>

        <SentinelStatus notebookId={notebookId} />
      </div>

      {/* CENTER — Research Mode & Model */}
      <div className="nb-header-center">
        {setMode && (
          <div className="nb-mode-segmented" role="tablist" aria-label="Research mode">
            {MODES.map((item) => {
              const isActive = mode === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setMode(item.id)}
                  className={`nb-mode-btn ${isActive ? 'active' : ''}`}
                >
                  <span className="nb-mode-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {llmHealth && (
          <>
            <span className="nb-header-divider" aria-hidden="true" />
            <button
              type="button"
              onClick={() => navigate('/settings')}
              title={isOnline ? `Active model: ${llmHealth.model} (Click to configure)` : 'Model offline (Click to configure)'}
              className="nb-model-selector"
            >
              <span className="nb-model-dot" style={{ backgroundColor: statusColor }} />
              <span className="nb-model-name">{modelName}</span>
            </button>
          </>
        )}
      </div>

      {/* RIGHT — Notebook Actions */}
      <div className="nb-header-right">
        <button
          type="button"
          className="nb-create-btn"
          onClick={onCreateNotebook || (() => navigate('/'))}
          title="Create new notebook"
        >
          <Plus size={14} strokeWidth={2.2} />
          <span>New Notebook</span>
        </button>

        <span className="nb-header-divider" aria-hidden="true" />

        <div className="nb-secondary-actions">
          {onOpenShortcuts && (
            <button
              type="button"
              onClick={onOpenShortcuts}
              title="Keyboard shortcuts (⌘?)"
              aria-label="Keyboard shortcuts"
              className="nb-icon-btn"
            >
              <Keyboard size={15} />
            </button>
          )}

          {onClearChat && (
            confirmClear ? (
              <div className="nb-clear-confirm" role="group" aria-label="Confirm clear chat">
                <span className="nb-clear-confirm-label">Clear?</span>
                <button
                  type="button"
                  className="nb-icon-btn danger"
                  title="Confirm clear chat"
                  aria-label="Confirm clear chat"
                  onClick={() => {
                    onClearChat();
                    setConfirmClear(false);
                  }}
                >
                  <Check size={13} />
                </button>
                <button
                  type="button"
                  className="nb-icon-btn"
                  title="Cancel"
                  aria-label="Cancel clear chat"
                  onClick={() => setConfirmClear(false)}
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                title="Clear conversation"
                aria-label="Clear conversation"
                className="nb-icon-btn danger"
              >
                <Trash2 size={15} />
              </button>
            )
          )}

          <button
            type="button"
            className="nb-icon-btn"
            onClick={onExport}
            title="Export Markdown"
            aria-label="Export Markdown"
          >
            <Download size={15} />
          </button>

          <button
            type="button"
            className="nb-icon-btn"
            onClick={() => navigate('/settings')}
            title="Settings"
            aria-label="Settings"
          >
            <Settings size={15} />
          </button>
        </div>
      </div>
    </header>
  );
}
