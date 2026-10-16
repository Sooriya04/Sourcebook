import React from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function AddSourceInputForm({
  activeType,
  value,
  onChange,
  onSubmit,
  onBack,
  loading,
  errorMessage
}) {
  return (
    <form onSubmit={onSubmit} className="add-source-inline-form">
      <div className="inline-form-header">
        <button
          type="button"
          className="inline-form-back-btn"
          onClick={onBack}
        >
          <ArrowLeft size={13} />
          <span>Back</span>
        </button>
        <h4 className="inline-form-title">Add {activeType}</h4>
      </div>

      {activeType === 'Copied text' ? (
        <textarea
          className="inline-form-textarea"
          placeholder="Paste research text or markdown snippet..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
          rows={6}
        />
      ) : (
        <input
          type="url"
          className="inline-form-input"
          placeholder={activeType === 'YouTube' ? 'https://youtube.com/watch?v=...' : 'https://example.com/article'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoFocus
        />
      )}

      {errorMessage && (
        <div className="add-source-error-banner">
          {errorMessage}
        </div>
      )}

      <div className="inline-form-actions">
        <button
          type="button"
          className="inline-form-cancel"
          onClick={onBack}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-form-submit"
          disabled={!value.trim() || loading}
        >
          {loading ? (
            <>
              <Loader2 size={12} className="spin" />
              <span>Fetching...</span>
            </>
          ) : (
            'Add Source'
          )}
        </button>
      </div>
    </form>
  );
}
