import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit3, Trash2, Copy, Download, Check } from 'lucide-react';
import MarkdownBadge from './MarkdownBadge';

export default function StudioNoteItem({ note, sourcesCount = 0, onSelectNote, onDeleteNote }) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const cleanTitle = (raw) => {
    if (!raw) return 'Untitled Note';
    let t = raw.replace(/\*\*(.*?)\*\*/g, '$1').replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/^#+\s*/g, '').trim();
    if (note.isScript && !t.endsWith('.md')) t = `${t}.md`;
    return t || 'Untitled Note';
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return 'Recently';
    const diffHours = Math.floor((Date.now() - new Date(dateStr).getTime()) / 3600000);
    if (isNaN(diffHours)) return 'Recently';
    if (diffHours >= 24) return `${Math.floor(diffHours / 24)}d ago`;
    return diffHours > 0 ? `${diffHours}h ago` : 'Just now';
  };

  const title = cleanTitle(note.title);
  const sCount = note.sourcesCount || sourcesCount || 0;
  const timeAgo = formatTimeAgo(note.created_at || note.updated_at);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(note.content || '');
    setCopied(true);
    setTimeout(() => { setCopied(false); setShowMenu(false); }, 1200);
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
      style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', padding: '8px 10px', borderRadius: '10px', cursor: 'pointer', transition: 'background-color 0.15s ease' }}
      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
    >
      <MarkdownBadge size={22} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 500, color: '#f4f4f5', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={title}>{title}</div>
        <div style={{ fontSize: '0.71rem', color: '#9aa0a6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sCount} sources • {timeAgo}</div>
      </div>

      <div style={{ flexShrink: 0 }}>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
          style={{ background: 'transparent', border: 'none', color: '#9aa0a6', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', borderRadius: '4px' }}
          title="Options"
        >
          <MoreVertical size={14} />
        </button>
      </div>

      {showMenu && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          style={{ position: 'absolute', top: '36px', right: '6px', backgroundColor: '#1e1f20', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: '12px', padding: '5px', zIndex: 60, boxShadow: '0 8px 24px rgba(0,0,0,0.6)', minWidth: '140px' }}
        >
          <button type="button" onClick={() => { setShowMenu(false); onSelectNote?.(note); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', background: 'transparent', border: 'none', color: '#e3e3e3', fontSize: '0.78rem', cursor: 'pointer', borderRadius: '8px', textAlign: 'left' }}>
            <Edit3 size={14} style={{ color: '#9aa0a6' }} /> Edit Note
          </button>
          <button type="button" onClick={handleCopy} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', background: 'transparent', border: 'none', color: '#e3e3e3', fontSize: '0.78rem', cursor: 'pointer', borderRadius: '8px', textAlign: 'left' }}>
            {copied ? <Check size={14} color="#22c55e" /> : <Copy size={14} style={{ color: '#9aa0a6' }} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button type="button" onClick={handleDownload} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', background: 'transparent', border: 'none', color: '#e3e3e3', fontSize: '0.78rem', cursor: 'pointer', borderRadius: '8px', textAlign: 'left' }}>
            <Download size={14} style={{ color: '#9aa0a6' }} /> Download
          </button>
          <button type="button" onClick={() => { setShowMenu(false); onDeleteNote?.(note.id); }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '7px 10px', background: 'transparent', border: 'none', color: '#f87171', fontSize: '0.78rem', cursor: 'pointer', borderRadius: '8px', textAlign: 'left' }}>
            <Trash2 size={14} style={{ color: '#f87171' }} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}
