import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, MoreVertical, Download, Trash2, Pencil } from 'lucide-react';

export default function StudioAudioItem({
  episode, notebookTitle = '', sourcesCount = 0, isCurrentPlaying = false, isPlaying = false,
  currentTime = 0, duration = 0, onTogglePlay, onOpenOverview, onDeleteEpisode, onRenameEpisode
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const menuRef = useRef(null);

  const getCleanTitle = () => {
    if (episode.title) return episode.title;
    if (episode.summary) {
      const first = episode.summary.split('.')[0].replace(/^(this episode explores|austin and taylor explore|welcome back!|we are digging into)\s*/i, '').trim();
      if (first.length > 5) return first.length > 38 ? `${first.slice(0, 36)}...` : first;
    }
    return notebookTitle ? `${notebookTitle} Overview` : 'Audio Overview';
  };

  const title = getCleanTitle();
  const [editTitle, setEditTitle] = useState(title);
  useEffect(() => { setEditTitle(title); }, [title]);

  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const formatTime = (s) => (!s || isNaN(s)) ? '0:00' : `${Math.floor(s / 60)}:${Math.floor(s % 60) < 10 ? '0' : ''}${Math.floor(s % 60)}`;
  const durStr = formatTime(episode.duration || duration);
  const sCount = episode.sources_count || episode.sourcesCount || sourcesCount || 0;
  const progressPercent = isCurrentPlaying && duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  const handleSaveRename = () => {
    setIsRenaming(false);
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== title) onRenameEpisode?.(episode.id, trimmed);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    const link = document.createElement('a');
    link.href = episode.audio_url || episode.audioUrl || `/api/sourcebook/v1/study/audio/${episode.notebook_id || ''}?episode=${episode.id}`;
    link.download = `${title.replace(/[^a-z0-9_-]/gi, '_')}.wav`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    onDeleteEpisode?.(episode.id);
  };

  return (
    <div
      onClick={() => !isRenaming && onOpenOverview?.(episode)}
      style={{
        position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px',
        padding: '8px 10px', borderRadius: '10px', cursor: 'pointer',
        backgroundColor: isCurrentPlaying ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
        transition: 'background-color 0.15s ease'
      }}
      onMouseEnter={(e) => { if (!isCurrentPlaying) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; }}
      onMouseLeave={(e) => { if (!isCurrentPlaying) e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', flexShrink: 0, color: '#8ab4f8' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '14px' }}>
            <span style={{ width: '2px', height: isCurrentPlaying && isPlaying ? '12px' : '6px', backgroundColor: '#8ab4f8', borderRadius: '1px' }} />
            <span style={{ width: '2px', height: isCurrentPlaying && isPlaying ? '14px' : '11px', backgroundColor: '#8ab4f8', borderRadius: '1px' }} />
            <span style={{ width: '2px', height: isCurrentPlaying && isPlaying ? '8px' : '5px', backgroundColor: '#8ab4f8', borderRadius: '1px' }} />
          </div>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="#8ab4f8" style={{ marginTop: '-4px' }}><path d="M12 2l2.4 6.8L21 12l-6.6 3.2L12 22l-2.4-6.8L3 12l6.6-3.2z" /></svg>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          {isRenaming ? (
            <input
              type="text"
              value={editTitle}
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveRename(); if (e.key === 'Escape') setIsRenaming(false); }}
              onBlur={handleSaveRename}
              style={{ width: '100%', background: '#131314', border: '1px solid #a8c7fa', borderRadius: '4px', color: '#f4f4f5', fontSize: '0.82rem', padding: '2px 6px', outline: 'none' }}
            />
          ) : (
            <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#f4f4f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={title}>{title}</div>
          )}
          <div style={{ fontSize: '0.71rem', color: '#9aa0a6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{durStr} • Deep Dive • {sCount} sources</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onTogglePlay?.(episode); }}
            title={isCurrentPlaying && isPlaying ? 'Pause Audio' : 'Play Audio Overview'}
            style={{ background: 'transparent', border: 'none', color: '#c4c7c5', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
          >
            {isCurrentPlaying && isPlaying ? <Pause size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" style={{ marginLeft: '1px' }} />}
          </button>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#1a73e8', flexShrink: 0 }} />
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            title="Options"
            style={{ background: 'transparent', border: 'none', color: '#9aa0a6', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
          >
            <MoreVertical size={14} />
          </button>
        </div>
      </div>

      {isCurrentPlaying && (
        <div style={{ width: '100%', height: '2px', backgroundColor: 'rgba(255, 255, 255, 0.08)', borderRadius: '1px', marginTop: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#8ab4f8' }} />
        </div>
      )}

      {showMenu && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'absolute', top: '36px', right: '6px', backgroundColor: '#1e1f20', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '5px', zIndex: 60, boxShadow: '0 8px 24px rgba(0,0,0,0.6)', minWidth: '140px' }}
        >
          <button type="button" onClick={(e) => { e.stopPropagation(); setShowMenu(false); setIsRenaming(true); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', background: 'transparent', border: 'none', color: '#e3e3e3', fontSize: '0.78rem', cursor: 'pointer', borderRadius: '8px', textAlign: 'left' }}>
            <Pencil size={14} style={{ color: '#9aa0a6' }} />
            <span>Rename</span>
          </button>
          <button type="button" onClick={handleDownload} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', background: 'transparent', border: 'none', color: '#e3e3e3', fontSize: '0.78rem', cursor: 'pointer', borderRadius: '8px', textAlign: 'left' }}>
            <Download size={14} style={{ color: '#9aa0a6' }} />
            <span>Download</span>
          </button>
          <button type="button" onClick={handleDelete} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', background: 'transparent', border: 'none', color: '#f87171', fontSize: '0.78rem', cursor: 'pointer', borderRadius: '8px', textAlign: 'left' }}>
            <Trash2 size={14} style={{ color: '#f87171' }} />
            <span>Delete</span>
          </button>
        </div>
      )}
    </div>
  );
}
