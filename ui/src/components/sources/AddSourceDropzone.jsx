import React from 'react';
import { UploadCloud, FileText } from 'lucide-react';

export default function AddSourceDropzone({
  dragActive,
  loading,
  uploadProgress,
  onDrag,
  onDrop,
  onClick
}) {
  return (
    <div
      onDragEnter={onDrag}
      onDragOver={onDrag}
      onDragLeave={onDrag}
      onDrop={onDrop}
      onClick={onClick}
      className={`add-source-dropzone ${dragActive ? 'drag-active' : ''}`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {loading ? (
        <div className="dropzone-progress-box">
          <div className="dropzone-progress-label">
            Ingesting document... {uploadProgress}%
          </div>
          <div className="dropzone-progress-track">
            <div
              className="dropzone-progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      ) : (
        <>
          <div className="dropzone-icon-box">
            {dragActive ? (
              <UploadCloud size={24} className="text-indigo-400" />
            ) : (
              <FileText size={24} className="text-zinc-500" />
            )}
          </div>
          <span className="dropzone-title">
            Drag & drop files here or browse
          </span>
          <span className="dropzone-sub">
            PDF, TXT, MD, JSON, CSV, or Images
          </span>
        </>
      )}
    </div>
  );
}
