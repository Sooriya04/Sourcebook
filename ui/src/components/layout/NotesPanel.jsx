import React from 'react';
import { Bookmark, Mic, Trash2, Radio } from 'lucide-react';

export default function NotesPanel({ notes = [], onDeleteNote }) {
  return (
    <aside className="notes-panel">
      <div className="notes-header">
        <div className="notes-title">
          <Bookmark size={16} color="var(--text-main)" />
          <span>Studio & Saved Notes</span>
        </div>
      </div>

      <div className="podcast-section-card">
        <div className="podcast-header">
          <Mic size={18} color="var(--text-main)" />
          <span>Audio Overview</span>
          <span className="phase-badge">Phase 5</span>
        </div>
        <p className="podcast-desc">
          Generate a 2-host podcast deep-dive summary audio from your active notebook sources.
        </p>
        <button className="podcast-btn" disabled>
          <Radio size={14} /> Generate Audio Overview
        </button>
      </div>

      <div className="notes-section">
        <div className="notes-section-title">Saved Snippets ({notes.length})</div>
        {notes.length === 0 ? (
          <div className="notes-empty">
            <p>No saved notes yet.</p>
            <p className="empty-sub">Click "Save Note" on any AI response to pin key takeaways here.</p>
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
    </aside>
  );
}
