import React, { useState, useEffect } from 'react';

export default function NoteEditor({ note, onSave, onCancel }) {
  const isNew = note === 'new';
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  useEffect(() => {
    if (note && note !== 'new') {
      setTitle(note.title || '');
      setContent(note.content || '');
    } else {
      setTitle('');
      setContent('');
    }
  }, [note]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    onSave({
      id: isNew ? Date.now().toString() : note.id,
      title: title.trim() || 'Untitled Note',
      content: content.trim()
    });
  };

  return (
    <form onSubmit={handleSubmit} className="note-editor-container">
      <div className="note-editor-header">
        <span className="note-editor-heading">
          {isNew ? 'New Studio Note' : 'Edit Studio Note'}
        </span>
      </div>

      <input
        type="text"
        placeholder="Note Title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="note-editor-title-input"
        autoFocus
      />

      <textarea
        placeholder="Write your research notes, ideas, or markdown snippets..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="note-editor-textarea"
        rows={8}
      />

      <div className="note-editor-actions">
        <button
          type="button"
          onClick={onCancel}
          className="note-editor-btn-cancel"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!content.trim()}
          className="note-editor-btn-save"
        >
          Save Note
        </button>
      </div>
    </form>
  );
}
