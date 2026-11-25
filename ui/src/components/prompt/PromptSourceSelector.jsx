import React from 'react';
import { Layers, CheckCircle2, GlobeOff } from 'lucide-react';

export default function PromptSourceSelector({
  sourceMode = 'all',
  onSourceModeChange,
  totalSources = 0,
  selectedSourcesCount = 0
}) {
  const options = [
    {
      id: 'all',
      label: 'All sources',
      meta: `${totalSources} available`
    },
    {
      id: 'selected',
      label: 'Selected only',
      meta: `${selectedSourcesCount} checked`
    },
    {
      id: 'none',
      label: 'No grounding',
      meta: 'General model'
    }
  ];

  const isGrounded = sourceMode !== 'none';
  const effectiveCount =
    sourceMode === 'all' ? totalSources : sourceMode === 'selected' ? selectedSourcesCount : 0;

  return (
    <div className="prompt-field">
      <div className="prompt-field-header">
        <span className="prompt-field-label">Source Context</span>
        <span className={`prompt-grounding-pill ${isGrounded ? 'grounded' : 'ungrounded'}`}>
          {isGrounded ? <CheckCircle2 size={11} /> : <GlobeOff size={11} />}
          <span>
            {isGrounded
              ? `Grounded · ${effectiveCount} source${effectiveCount === 1 ? '' : 's'}`
              : 'Source grounding off'}
          </span>
        </span>
      </div>

      <div className="prompt-source-segmented" role="radiogroup" aria-label="Source context mode">
        {options.map((opt) => {
          const active = sourceMode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onSourceModeChange(opt.id)}
              className={`prompt-source-btn ${active ? 'active' : ''}`}
            >
              <span className="prompt-source-btn-title">{opt.label}</span>
              <span className="prompt-source-btn-meta">{opt.meta}</span>
            </button>
          );
        })}
      </div>

      {sourceMode === 'selected' && selectedSourcesCount === 0 && (
        <div className="prompt-warning-inline">
          <Layers size={13} />
          <span>No sources are checked in the Sources panel. Check at least one source or switch to All sources.</span>
        </div>
      )}

      {sourceMode === 'all' && totalSources === 0 && (
        <div className="prompt-warning-inline">
          <Layers size={13} />
          <span>This notebook has no sources yet. Add sources or switch to No grounding.</span>
        </div>
      )}
    </div>
  );
}
