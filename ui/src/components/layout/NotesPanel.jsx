import React, { useState } from 'react';
import { PanelRightClose } from 'lucide-react';
import StudioToolsGrid from './StudioToolsGrid';
import NoteEditor from './NoteEditor';
import SavedNotesList from './SavedNotesList';

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
  const [editorNote, setEditorNote] = useState(null);

  const handleOpenNewNote = () => setEditorNote('new');
  const handleOpenEditNote = (note) => setEditorNote(note);

  const handleSaveNote = (noteData) => {
    if (editorNote === 'new') {
      onAddNote?.(noteData);
    } else {
      onUpdateNote?.(noteData);
    }
    setEditorNote(null);
  };

  if (isCollapsed) {
    return null;
  }

  return (
    <aside className="notes-panel-tasteful" style={{ width: '320px', flexShrink: 0, height: '100%' }}>
      {/* Studio Header */}
      <div className="notes-panel-header">
        <h3 className="notes-panel-heading">Studio</h3>
        <button 
          type="button"
          className="notes-panel-collapse-btn" 
          onClick={onToggleCollapse} 
          title="Minimize Studio Panel"
          aria-label="Minimize studio panel"
        >
          <PanelRightClose size={15} />
        </button>
      </div>

      <div className="notes-panel-scrollable">
        {editorNote ? (
          <NoteEditor
            note={editorNote}
            onSave={handleSaveNote}
            onCancel={() => setEditorNote(null)}
          />
        ) : (
          <>
            <StudioToolsGrid
              activeMode={activeMode}
              setActiveMode={setActiveMode}
              studyTab={studyTab}
              setStudyTab={setStudyTab}
            />

            <SavedNotesList
              notes={notes}
              onSelectNote={handleOpenEditNote}
              onAddNote={handleOpenNewNote}
              onDeleteNote={onDeleteNote}
            />
          </>
        )}
      </div>
    </aside>
  );
}
