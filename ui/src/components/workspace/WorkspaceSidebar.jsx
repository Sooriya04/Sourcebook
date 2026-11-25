import React from 'react';
import { 
  BookOpen, 
  Clock, 
  Archive, 
  Plus, 
  Video, 
  Layers, 
  X,
  Library,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function WorkspaceSidebar({
  notebooks = [],
  activeView = 'all',
  onSelectView,
  archivedIds = [],
  onNewNotebook,
  onOpenYouTube,
  isOpen = false,
  onClose
}) {
  const navigate = useNavigate();

  const totalCount = notebooks.length;
  const archivedCount = archivedIds.length;
  const activeCount = Math.max(0, totalCount - archivedCount);

  // Active library notebooks (not archived)
  const libraryNotebooks = notebooks.filter(nb => !archivedIds.includes(nb.id));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="workspace-sidebar-backdrop"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`workspace-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Mobile Close Button */}
        <div className="workspace-sidebar-mobile-header">
          <span className="workspace-sidebar-brand">Workspace</span>
          <button 
            type="button" 
            onClick={onClose} 
            className="workspace-sidebar-close-btn"
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Primary Action Button */}
        <div className="workspace-sidebar-primary-action">
          <button
            type="button"
            className="workspace-new-notebook-btn"
            onClick={onNewNotebook}
          >
            <Plus size={15} strokeWidth={2.4} />
            <span>New Notebook</span>
          </button>
        </div>

        {/* Workspace Navigation Views */}
        <nav className="workspace-nav-section" aria-label="Workspace Views">
          <div className="workspace-section-label">Workspace</div>

          <button
            type="button"
            className={`workspace-nav-item ${activeView === 'all' ? 'active' : ''}`}
            onClick={() => onSelectView('all')}
          >
            <BookOpen size={15} className="workspace-nav-icon" />
            <span className="workspace-nav-text">All Notebooks</span>
            <span className="workspace-nav-count">{activeCount}</span>
          </button>

          <button
            type="button"
            className={`workspace-nav-item ${activeView === 'recent' ? 'active' : ''}`}
            onClick={() => onSelectView('recent')}
          >
            <Clock size={15} className="workspace-nav-icon" />
            <span className="workspace-nav-text">Recent</span>
          </button>

          <button
            type="button"
            className={`workspace-nav-item ${activeView === 'archived' ? 'active' : ''}`}
            onClick={() => onSelectView('archived')}
          >
            <Archive size={15} className="workspace-nav-icon" />
            <span className="workspace-nav-text">Archived</span>
            {archivedCount > 0 && (
              <span className="workspace-nav-count">{archivedCount}</span>
            )}
          </button>
        </nav>

        {/* Research Tools Section */}
        <div className="workspace-nav-section">
          <div className="workspace-section-label">Research Tools</div>

          <button
            type="button"
            className="workspace-nav-item secondary"
            onClick={onOpenYouTube}
            title="Chat directly with any YouTube video"
          >
            <Video size={15} className="workspace-nav-icon text-accent" />
            <span className="workspace-nav-text">Chat with YouTube</span>
          </button>
        </div>

        {/* Library Section (Existing Notebooks) */}
        <div className="workspace-library-section">
          <div className="workspace-library-header">
            <span className="workspace-section-label" style={{ padding: 0 }}>Library</span>
            <span className="workspace-library-count">{libraryNotebooks.length}</span>
          </div>

          <div className="workspace-library-list">
            {libraryNotebooks.length === 0 ? (
              <div className="workspace-library-empty">
                <span>No notebooks created yet.</span>
              </div>
            ) : (
              libraryNotebooks.map((nb) => (
                <button
                  key={nb.id}
                  type="button"
                  className="workspace-library-item"
                  onClick={() => navigate(`/notebook/${nb.id}`)}
                  title={nb.title}
                >
                  <BookOpen size={13} className="workspace-library-item-icon" />
                  <span className="workspace-library-item-title">{nb.title}</span>
                  <ChevronRight size={12} className="workspace-library-item-arrow" />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Bottom Workspace Status */}
        <div className="workspace-sidebar-footer">
          <div className="workspace-footer-status">
            <span className="workspace-footer-dot" />
            <span>Local Research Mode</span>
          </div>
        </div>
      </aside>
    </>
  );
}
