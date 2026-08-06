import React from 'react';
import { 
  Mic, 
  BrainCircuit, 
  Network, 
  FileText, 
  HelpCircle, 
  ChevronRight, 
  PanelRightClose, 
  Plus, 
  Trash2,
  Bookmark
} from 'lucide-react';

export default function NotesPanel({ 
  notes = [], 
  onDeleteNote, 
  activeMode, 
  setActiveMode,
  isCollapsed,
  onToggleCollapse 
}) {
  const studioTools = [
    {
      id: 'audio',
      title: 'Audio Overview',
      icon: <Mic size={16} className="tool-icon audio-icon" />,
      action: () => alert('Audio Overview synthesis coming in Phase 5!')
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      icon: <BrainCircuit size={16} className="tool-icon flashcard-icon" />,
      action: () => setActiveMode(activeMode === 'study' ? 'chat' : 'study'),
      isActive: activeMode === 'study'
    },
    {
      id: 'quiz',
      title: 'Quiz',
      icon: <HelpCircle size={16} className="tool-icon quiz-icon" />,
      action: () => alert('Quiz generator coming soon!')
    },
    {
      id: 'mindmap',
      title: 'Mind Map',
      icon: <Network size={16} className="tool-icon map-icon" />,
      action: () => alert('Mind Map generator coming soon!')
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: <FileText size={16} className="tool-icon report-icon" />,
      action: () => alert('Report generator coming soon!')
    }
  ];

  if (isCollapsed) {
    return <aside className="notes-panel studio-panel collapsed-hidden-panel" style={{ display: 'none' }} />;
  }

  return (
    <aside className="notes-panel studio-panel">
      {/* Header */}
      <div className="studio-panel-header">
        <h3 className="studio-panel-title">Studio</h3>
        <button 
          className="panel-toggle-btn" 
          onClick={onToggleCollapse} 
          title="Minimize Studio Panel"
        >
          <PanelRightClose size={16} />
        </button>
      </div>

      <div className="studio-scroll-area">
        {/* Studio Tool 2-Column Grid */}
        <div className="studio-grid">
          {studioTools.map((tool) => (
            <div 
              key={tool.id} 
              className={`studio-tile ${tool.isActive ? 'active-tile' : ''}`}
              onClick={tool.action}
            >
              <div className="tile-left">
                {tool.icon}
                <span className="tile-title">{tool.title}</span>
              </div>
              <ChevronRight size={12} className="tile-chevron" />
            </div>
          ))}
        </div>

        {/* Saved Notes Section */}
        <div className="saved-notes-container">
          <div className="saved-notes-header">
            <Bookmark size={14} className="notes-bookmark-icon" />
            <span className="saved-notes-title">Studio Notes ({notes.length})</span>
          </div>

          {notes.length === 0 ? (
            <div className="notes-empty-state">
              <p>Studio notes appear here.</p>
              <p className="empty-sub">After adding sources, click "Save Note" on AI answers or add notes manually.</p>
            </div>
          ) : (
            <div className="notes-list">
              {notes.map((note) => (
                <div key={note.id} className="note-card">
                  <div className="note-card-header">
                    <span className="note-title">{note.title}</span>
                    {onDeleteNote && (
                      <button
                        className="note-delete-btn"
                        onClick={() => onDeleteNote(note.id)}
                        title="Delete note"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <div className="note-content">{note.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Add Note Action Button */}
      <button 
        className="floating-add-note-btn" 
        onClick={() => {
          const text = prompt("Enter your note:");
          if (text) {
            alert("Note saved!");
          }
        }}
      >
        <Plus size={16} />
        <span>Add note</span>
      </button>
    </aside>
  );
}
