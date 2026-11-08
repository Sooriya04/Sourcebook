import React, { useState } from 'react';
import { PanelRightClose } from 'lucide-react';
import StudioToolsGrid from './StudioToolsGrid';
import NoteEditor from './NoteEditor';
import SavedNotesList from './SavedNotesList';

export default function NotesPanel({ 
  notes = [], episodes = [], notebookTitle = '', sourcesCount = 0, audioPlayer = {},
  onAddNote, onUpdateNote, onDeleteNote, onDeleteEpisode, onRenameEpisode,
  activeMode, setActiveMode, isCollapsed, onToggleCollapse, studyTab, setStudyTab
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

  const handleOpenOverview = (ep) => {
    setActiveMode?.('study');
    setStudyTab?.('audio');
    if (ep && audioPlayer?.setCurrentEpisode) {
      audioPlayer.setCurrentEpisode(ep);
    }
  };

  const handleOpenScript = (ep) => {
    const slug = (notebookTitle || 'overview').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = notes.find((n) => n.id === `note_script_${ep.id}` || n.title === `${slug}-script.md`);
    if (existing) { setEditorNote(existing); return; }
    let content = `# ${notebookTitle || 'Workspace'} — Audio Overview Script\n\n`;
    if (ep.summary) content += `## Executive Brief\n${ep.summary}\n\n`;
    if (ep.takeaways?.length > 0) {
      content += `## Core Takeaways\n` + ep.takeaways.map((t) => `- ${t}`).join('\n') + '\n\n';
    }
    if (ep.turns?.length > 0) {
      content += `## Spoken Dialogue\n\n` + ep.turns.map((turn) => {
        const spk = turn.name || (turn.speaker === 'austin' ? 'Austin' : 'Taylor');
        return `**${spk}**: ${turn.text}`;
      }).join('\n\n') + '\n\n';
    }
    const newScript = {
      id: `note_script_${ep.id}`,
      title: `${slug}-script.md`,
      content,
      isScript: true,
      sourcesCount: sourcesCount || 0,
      created_at: ep.created_at || new Date().toISOString()
    };
    onAddNote?.(newScript);
    setEditorNote(newScript);
  };

  if (isCollapsed) return null;

  return (
    <aside className="notes-panel-tasteful">
      {/* Studio Header (Clean Typography) */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px 10px 16px',
          flexShrink: 0
        }}
      >
        <h3 style={{ fontSize: '0.92rem', fontWeight: 500, color: '#f4f4f5', margin: 0, letterSpacing: '-0.01em' }}>
          Studio
        </h3>
        <button 
          type="button"
          onClick={onToggleCollapse} 
          title="Minimize Studio Panel"
          aria-label="Minimize studio panel"
          style={{
            background: 'transparent',
            border: 'none',
            color: '#9aa0a6',
            padding: '4px',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#ffffff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#9aa0a6'; }}
        >
          <PanelRightClose size={16} />
        </button>
      </div>

      <div className="notes-panel-scrollable" style={{ padding: '0 14px 14px 14px', flex: 1, overflowY: 'auto' }}>
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
              episodes={episodes}
              notes={notes}
              notebookTitle={notebookTitle}
              sourcesCount={sourcesCount}
              audioPlayer={audioPlayer}
              onSelectNote={handleOpenEditNote}
              onAddNote={handleOpenNewNote}
              onDeleteNote={onDeleteNote}
              onDeleteEpisode={onDeleteEpisode}
              onRenameEpisode={onRenameEpisode}
              onOpenOverview={handleOpenOverview}
              onOpenScript={handleOpenScript}
            />
          </>
        )}
      </div>
    </aside>
  );
}
