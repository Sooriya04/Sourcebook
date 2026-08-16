import React, { useState } from 'react';
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
  Bookmark,
  X,
  Edit2,
  MessageSquare
} from 'lucide-react';
import { parseCitations } from '../../utils/citationParser';

export default function NotesPanel({ 
  notes = [], 
  onAddNote,
  onUpdateNote,
  onDeleteNote, 
  activeMode, 
  setActiveMode,
  isCollapsed,
  onToggleCollapse,
  studyTab,
  setStudyTab
}) {
  const [editorNote, setEditorNote] = useState(null); // null, 'new', or note object
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const studioTools = [
    {
      id: 'chat',
      title: 'Chat Studio',
      icon: <MessageSquare size={14} className="tool-icon chat-icon" style={{ color: 'var(--accent-primary)' }} />,
      action: () => {
        setActiveMode('chat');
        if (setStudyTab) setStudyTab('chat');
      },
      isActive: activeMode === 'chat'
    },
    {
      id: 'briefing',
      title: 'Briefing Doc',
      icon: <FileText size={14} className="tool-icon briefing-icon" style={{ color: '#60a5fa' }} />,
      action: () => {
        setActiveMode('study');
        if (setStudyTab) setStudyTab('briefing');
      },
      isActive: activeMode === 'study' && studyTab === 'briefing'
    },
    {
      id: 'audio',
      title: 'Audio Overview',
      icon: <Mic size={14} className="tool-icon audio-icon" style={{ color: '#10b981' }} />,
      action: () => {
        setActiveMode('study');
        if (setStudyTab) setStudyTab('audio');
      },
      isActive: activeMode === 'study' && studyTab === 'audio'
    },
    {
      id: 'flashcards',
      title: 'Flashcards',
      icon: <BrainCircuit size={14} className="tool-icon flashcard-icon" style={{ color: '#a78bfa' }} />,
      action: () => {
        setActiveMode('study');
        if (setStudyTab) setStudyTab('flashcards');
      },
      isActive: activeMode === 'study' && studyTab === 'flashcards'
    },
    {
      id: 'quiz',
      title: 'Quiz',
      icon: <HelpCircle size={14} className="tool-icon quiz-icon" style={{ color: '#f59e0b' }} />,
      action: () => {
        setActiveMode('study');
        if (setStudyTab) setStudyTab('quiz');
      },
      isActive: activeMode === 'study' && studyTab === 'quiz'
    },
    {
      id: 'mindmap',
      title: 'Mind Map',
      icon: <Network size={14} className="tool-icon map-icon" style={{ color: '#ec4899' }} />,
      action: () => {
        setActiveMode('study');
        if (setStudyTab) setStudyTab('mindmap');
      },
      isActive: activeMode === 'study' && studyTab === 'mindmap'
    },
    {
      id: 'reports',
      title: 'Reports',
      icon: <FileText size={14} className="tool-icon report-icon" style={{ color: '#3b82f6' }} />,
      action: () => {
        setActiveMode('study');
        if (setStudyTab) setStudyTab('reports');
      },
      isActive: activeMode === 'study' && studyTab === 'reports'
    }
  ];

  const handleOpenNewNote = () => {
    setEditorNote('new');
    setEditTitle('');
    setEditContent('');
  };

  const handleOpenEditNote = (note) => {
    setEditorNote(note);
    setEditTitle(note.title || '');
    setEditContent(note.content || '');
  };

  const handleSave = () => {
    if (!editContent.trim()) return;
    const finalTitle = editTitle.trim() || 'Untitled Note';
    if (editorNote === 'new') {
      if (onAddNote) {
        onAddNote({
          id: Date.now().toString(),
          title: finalTitle,
          content: editContent
        });
      }
    } else {
      if (onUpdateNote) {
        onUpdateNote({
          id: editorNote.id,
          title: finalTitle,
          content: editContent
        });
      }
    }
    setEditorNote(null);
  };

  const handleDelete = () => {
    if (editorNote && editorNote !== 'new' && onDeleteNote) {
      onDeleteNote(editorNote.id);
      setEditorNote(null);
    }
  };

  if (isCollapsed) {
    return <aside className="notes-panel studio-panel collapsed-hidden-panel" style={{ display: 'none' }} />;
  }

  return (
    <aside className="notes-panel studio-panel" style={{ position: 'relative' }}>
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

      {editorNote ? (
        <div className="studio-scroll-area" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#8b8d97' }}>
              {editorNote === 'new' ? 'New Studio Note' : 'Edit Studio Note'}
            </span>
          </div>

          <input
            type="text"
            placeholder="Note Title..."
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            style={{
              background: '#1b1d22',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              padding: '10px 14px',
              color: '#ffffff',
              fontSize: '0.82rem',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
          <textarea
            placeholder="Write your thoughts or paste research snippets here..."
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            style={{
              background: '#1b1d22',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              borderRadius: '8px',
              padding: '12px 14px',
              color: '#ffffff',
              fontSize: '0.78rem',
              lineHeight: '1.6',
              resize: 'none',
              height: '300px',
              outline: 'none',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <button 
              onClick={() => setEditorNote(null)}
              className="cancel-btn"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: '#c4c6cd',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.78rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="submit-btn"
              style={{
                background: '#3b82f6',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '0.78rem',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Save Note
            </button>
          </div>
        </div>
      ) : (
        <div className="studio-scroll-area" style={{ paddingBottom: '80px' }}>
          {/* Studio Tool Grid */}
          <div className="studio-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
            {studioTools.map((tool) => (
              <div 
                key={tool.id} 
                className={`studio-tile ${tool.isActive ? 'active-tile' : ''}`}
                onClick={tool.action}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '12px',
                  minHeight: '70px',
                  borderRadius: '12px',
                  background: tool.isActive ? 'rgba(59, 130, 246, 0.15)' : '#1b1d22',
                  border: tool.isActive ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.04)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  gridColumn: tool.id === 'chat' ? 'span 2' : 'span 1'
                }}
              >
                <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                  {tool.icon}
                  <ChevronRight size={12} className="tile-chevron" style={{ opacity: 0.5 }} />
                </div>
                <span className="tile-title" style={{ fontSize: '0.72rem', fontWeight: '600', marginTop: '8px', color: '#c4c6cd' }}>
                  {tool.title}
                </span>
              </div>
            ))}
          </div>

          {/* Saved Notes Section */}
          <div className="saved-notes-container" style={{ marginTop: '20px' }}>
            <div className="saved-notes-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bookmark size={14} className="notes-bookmark-icon" style={{ color: '#8b8d97' }} />
                <span className="saved-notes-title" style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', color: '#8b8d97' }}>
                  Studio Notes ({notes.length})
                </span>
              </div>
              <button 
                onClick={handleOpenNewNote}
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  fontSize: '0.72rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <Plus size={12} />
                <span>Add Note</span>
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="notes-empty-state" style={{ background: '#1b1d22', borderRadius: '12px', padding: '20px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.03)' }}>
                <p style={{ margin: '0 0 6px 0', fontSize: '0.78rem', color: '#c4c6cd', fontWeight: '600' }}>Studio notes appear here.</p>
                <p className="empty-sub" style={{ margin: 0, fontSize: '0.7rem', color: '#8b8d97', lineHeight: '1.4' }}>
                  After adding sources, click "Save Note" on AI answers or add notes manually.
                </p>
              </div>
            ) : (
              <div className="notes-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notes.map((note) => {
                  const cleanedTitle = note.title
                    ? note.title
                        .replace(/\*\*(.*?)\*\*/g, '$1')
                        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                        .replace(/\([^)]*https?:\/\/[^)]*\)/g, '')
                        .replace(/^#+\s*/g, '')
                        .trim()
                    : 'Untitled Note';

                  return (
                    <div 
                      key={note.id} 
                      className="note-card"
                      onClick={() => handleOpenEditNote(note)}
                      style={{
                        background: '#1b1d22',
                        border: '1px solid rgba(255, 255, 255, 0.04)',
                        borderRadius: '12px',
                        padding: '14px',
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                    >
                      <div className="note-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                        <span className="note-title" style={{ fontSize: '0.78rem', fontWeight: '700', color: '#e3e4e8' }}>
                          {cleanedTitle}
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            className="note-delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onDeleteNote) onDeleteNote(note.id);
                            }}
                            title="Delete note"
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: '#8b8d97',
                              cursor: 'pointer',
                              padding: '2px',
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <div className="note-content" style={{ fontSize: '0.74rem', color: '#8b8d97', lineHeight: '1.5', maxHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
                        {parseCitations(note.content)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
