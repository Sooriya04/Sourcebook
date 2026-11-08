import React from 'react';
import StudioAudioItem from './StudioAudioItem';
import StudioNoteItem from './StudioNoteItem';

export default function SavedNotesList({
  episodes = [],
  notes = [],
  notebookTitle = '',
  sourcesCount = 0,
  audioPlayer = {},
  onSelectNote,
  onAddNote,
  onDeleteNote,
  onDeleteEpisode,
  onRenameEpisode,
  onOpenOverview,
  onOpenScript
}) {
  const { currentEpisode, isPlaying, currentTime, duration, togglePlayEpisode } = audioPlayer;
  const hasItems = episodes.length > 0 || notes.length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minHeight: 0 }}>
      {!hasItems ? (
        <div style={{ textAlign: 'center', padding: '24px 12px', color: '#71717a' }}>
          <p style={{ fontSize: '0.78rem', color: '#a1a1aa', margin: '0 0 4px 0', fontWeight: 500 }}>
            Studio artifacts appear here
          </p>
          <p style={{ fontSize: '0.7rem', margin: 0, lineHeight: 1.4 }}>
            Generate an Audio Overview or click "Add note" to capture research notes.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {/* Audio Overview Items */}
          {episodes.map((ep) => {
            const isCurr = currentEpisode?.id === ep.id;
            return (
              <StudioAudioItem
                key={ep.id}
                episode={ep}
                notebookTitle={notebookTitle}
                sourcesCount={sourcesCount}
                isCurrentPlaying={isCurr}
                isPlaying={isCurr && isPlaying}
                currentTime={currentTime}
                duration={ep.duration || duration}
                onTogglePlay={togglePlayEpisode}
                onOpenOverview={onOpenOverview}
                onOpenScript={onOpenScript}
                onDeleteEpisode={onDeleteEpisode}
                onRenameEpisode={onRenameEpisode}
              />
            );
          })}

          {/* Markdown Notes Items */}
          {notes.map((note) => (
            <StudioNoteItem
              key={note.id}
              note={note}
              sourcesCount={sourcesCount}
              onSelectNote={onSelectNote}
              onDeleteNote={onDeleteNote}
            />
          ))}
        </div>
      )}

      {/* Floating / Sticky Add Note Button */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '14px', marginBottom: '8px', position: 'sticky', bottom: '8px', zIndex: 10 }}>
        <button
          type="button"
          onClick={onAddNote}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '7px 20px',
            borderRadius: '9999px',
            backgroundColor: '#202227',
            border: 'none',
            color: '#e3e3e8',
            fontSize: '0.8rem',
            fontWeight: 500,
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
            transition: 'background-color 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#2c2e35';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#202227';
          }}
        >
          {/* Note Icon with 3 Stripes */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <rect x="3" y="3" width="18" height="18" rx="4" />
            <line x1="7" y1="8" x2="17" y2="8" />
            <line x1="7" y1="12" x2="17" y2="12" />
            <line x1="7" y1="16" x2="13" y2="16" />
          </svg>
          <span>Add note</span>
        </button>
      </div>
    </div>
  );
}
