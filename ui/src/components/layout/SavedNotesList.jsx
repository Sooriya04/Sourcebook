import React from 'react';
import { Bookmark, Plus, Trash2 } from 'lucide-react';
import { parseCitations } from '../../utils/citationParser';

export default function SavedNotesList({ notes = [], onSelectNote, onAddNote, onDeleteNote }) {
  const cleanTitle = (rawTitle) => {
    if (!rawTitle) return 'Untitled Note';
    return rawTitle
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\([^)]*https?:\/\/[^)]*\)/g, '')
      .replace(/^#+\s*/g, '')
      .trim() || 'Untitled Note';
  };

  return (
    <div className="saved-notes-section">
      <div className="saved-notes-header-row">
        <div className="saved-notes-title-group">
          <Bookmark size={13} className="text-zinc-400" />
          <span className="saved-notes-title-text">
            Studio Notes ({notes.length})
          </span>
        </div>
        <button
          type="button"
          onClick={onAddNote}
          className="saved-notes-add-btn"
        >
          <Plus size={12} strokeWidth={2.5} />
          <span>Add Note</span>
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="saved-notes-empty">
          <p className="saved-notes-empty-title">Studio notes appear here</p>
          <p className="saved-notes-empty-sub">
            Save answers from chat queries or click "Add Note" to write research memos.
          </p>
        </div>
      ) : (
        <div className="saved-notes-cards-stack">
          {notes.map((note) => (
            <div
              key={note.id}
              className="saved-note-card"
              onClick={() => onSelectNote(note)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectNote(note);
                }
              }}
            >
              <div className="saved-note-top">
                <span className="saved-note-title">
                  {cleanTitle(note.title)}
                </span>
                <button
                  type="button"
                  className="saved-note-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteNote?.(note.id);
                  }}
                  title="Delete note"
                  aria-label="Delete note"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <div className="saved-note-snippet">
                {parseCitations(note.content)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
