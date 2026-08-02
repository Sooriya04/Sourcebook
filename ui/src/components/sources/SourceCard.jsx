import React from 'react';
import { Globe, FileText, Video, Trash2 } from 'lucide-react';
import { truncateUrl } from '../../utils/formatters';

export default function SourceCard({ source, isActive, onClick, onDelete }) {
  const getIcon = () => {
    if (source.type === 'pdf' || source.type === 'file') {
      return <FileText size={14} color="var(--text-main)" />;
    }
    if (source.type === 'youtube') {
      return <Video size={14} color="var(--text-main)" />;
    }
    return <Globe size={14} color="var(--text-main)" />;
  };

  return (
    <div
      className={`source-card ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      <div className="source-card-header">
        <span className="source-index">[{source.index || '1'}]</span>
        <span className="source-title">{source.title || 'Untitled Source'}</span>
        {onDelete && (
          <button
            className="source-delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(source.index);
            }}
            title="Remove source"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      <div className="source-url">
        {getIcon()}
        <span style={{ marginLeft: '4px' }}>
          {source.url ? truncateUrl(source.url) : source.filename || 'Uploaded Document'}
        </span>
      </div>
    </div>
  );
}
