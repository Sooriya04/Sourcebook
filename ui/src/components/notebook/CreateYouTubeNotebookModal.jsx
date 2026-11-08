import React, { useState } from 'react';
import { Video, ArrowRight, Type } from 'lucide-react';
import Modal from '../ui/Modal';

export function extractYouTubeId(url) {
  if (!url) return '';
  const cleanUrl = url.trim();
  const match = cleanUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (match && match[1]) {
    return match[1];
  }
  if (/^[\w-]{11}$/.test(cleanUrl)) {
    return cleanUrl;
  }
  return '';
}

export default function CreateYouTubeNotebookModal({ isOpen, onClose, onOpenChat }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    const vId = extractYouTubeId(url.trim());
    if (!vId) {
      setError('Please provide a valid YouTube video URL or 11-character video ID.');
      return;
    }

    setError('');
    const customTitle = title.trim();
    setUrl('');
    setTitle('');
    onOpenChat(vId, customTitle);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chat with YouTube Video"
      description="Paste any YouTube video link to enter a dedicated watch-and-chat research workspace."
      maxWidth="500px"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label htmlFor="yt-url" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            YouTube Video Link <span style={{ color: 'var(--accent)' }}>*</span>
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="yt-url"
              type="text"
              className="form-input"
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError('');
              }}
              required
              autoFocus
              style={{ paddingLeft: '36px' }}
            />
            <Video size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          </div>
          {error && (
            <p style={{ color: 'var(--status-error)', fontSize: '0.76rem', margin: '6px 0 0' }}>{error}</p>
          )}
        </div>

        <div>
          <label htmlFor="yt-title" style={{ display: 'block', fontSize: '0.78rem', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>
            Workspace Title (Optional)
          </label>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input
              id="yt-title"
              type="text"
              className="form-input"
              placeholder="e.g. TypeScript Ported to Rust Analysis"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              style={{ paddingLeft: '36px' }}
            />
            <Type size={16} style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)' }} />
          </div>
          <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '4px' }}>
            Leave blank to automatically detect video title from YouTube.
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', paddingTop: '16px', borderTop: '1px solid var(--border-default)' }}>
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn-primary"
            disabled={!url.trim()}
          >
            <span>Start Chat</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
