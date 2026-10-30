import React, { useState } from 'react';
import { MoreVertical, Edit3, Trash2, Copy, Download, Check } from 'lucide-react';
import MarkdownBadge from './MarkdownBadge';

export default function StudioNoteItem({
  note,
  sourcesCount = 0,
  onSelectNote,
  onDeleteNote
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const cleanTitle = (rawTitle) => {
    if (!rawTitle) return 'Untitled Note';
    let t = rawTitle
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/\([^)]*https?:\/\/[^)]*\)/g, '')
      .replace(/^#+\s*/g, '')
      .trim();
    if (note.isScript && !t.endsWith('.md')) {
      t = `${t}.md`;
    }
    return t || 'Untitled Note';
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    if (isNaN(diffMs)) return 'Recently';
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes > 1) return `${diffMinutes}m ago`;
    return 'Just now';
  };

  const title = cleanTitle(note.title);
  const sCount = note.sourcesCount || sourcesCount || 0;
  const timeAgo = formatTimeAgo(note.created_at || note.updated_at);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(note.content || '');
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
      setShowMenu(false);
    }, 1200);
  };

  const handleDownload = (e) => {
    e.stopPropagation();
    const blob = new Blob([note.content || ''], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = title.endsWith('.md') ? title : `${title}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  return (
    <div
      onClick={() => onSelectNote?.(note)}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        padding: '8px 10px',
        borderRadius: '10px',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        transition: 'background-color 0.15s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
      }}
    >
      {/* Left: Markdown Icon */}
      <MarkdownBadge size={22} />

      {/* Middle: Title & Subtitle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#f4f4f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={title}>
          {title}
        </div>
        <div style={{ fontSize: '0.71rem', color: '#9aa0a6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {sCount} sources • {timeAgo}
        </div>
      </div>

      {/* Right: Three Dots Action Menu */}
      <div style={{ flexShrink: 0 }}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          style={{ background: 'transparent', border: 'none', color: '#9aa0a6', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center' }}
          title="Note options"
        >
          <MoreVertical size={14} />
        </button>
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: '34px',
            right: '8px',
            backgroundColor: '#18181b',
            border: '1px solid #27272a',
            borderRadius: '8px',
            padding: '4px',
            zIndex: 50,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            minWidth: '140px'
          }}
        >
          <button
            type="button"
            onClick={() => { setShowMenu(false); onSelectNote?.(note); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'transparent', border: 'none', color: '#d4d4d8', fontSize: '0.72rem', cursor: 'pointer', borderRadius: '4px', textAlign: 'left' }}
          >
            <Edit3 size={12} /> Edit Note
          </button>
          <button
            type="button"
            onClick={handleCopy}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'transparent', border: 'none', color: '#d4d4d8', fontSize: '0.72rem', cursor: 'pointer', borderRadius: '4px', textAlign: 'left' }}
          >
            {copied ? <Check size={12} color="#22c55e" /> : <Copy size={12} />}
            <span>{copied ? 'Copied!' : 'Copy Markdown'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'transparent', border: 'none', color: '#d4d4d8', fontSize: '0.72rem', cursor: 'pointer', borderRadius: '4px', textAlign: 'left' }}
          >
            <Download size={12} /> Download .md
          </button>
          <button
            type="button"
            onClick={() => { setShowMenu(false); onDeleteNote?.(note.id); }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', background: 'transparent', border: 'none', color: '#f87171', fontSize: '0.72rem', cursor: 'pointer', borderRadius: '4px', textAlign: 'left' }}
          >
            <Trash2 size={12} /> Delete Note
          </button>
        </div>
      )}
    </div>
  );
}
