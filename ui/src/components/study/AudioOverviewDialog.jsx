import React, { useState, useEffect } from 'react';
import { Headphones, ChevronRight, Sparkles, Layers } from 'lucide-react';
import { getPodcastVoices } from '../../services/sourcebookApi';
import Modal from '../ui/Modal';

const LENGTH_OPTIONS = [
  { id: 'short', label: 'Quick', desc: '~1–2 min' },
  { id: 'standard', label: 'Standard', desc: '~2–3 min' },
  { id: 'deep', label: 'Deep Dive', desc: '~4–5 min' }
];

const FORMAT_OPTIONS = [
  { id: 'banter', label: 'Casual Banter (Two Hosts)' },
  { id: 'academic', label: 'Academic Review (Two Hosts)' },
  { id: 'debate', label: 'Spirited Debate (Two Hosts)' }
];

export default function AudioOverviewDialog({
  isOpen,
  onClose,
  options,
  setOptions,
  voices = [],
  sources = [],
  loading = false,
  onGenerate
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [fetchedVoices, setFetchedVoices] = useState([]);

  useEffect(() => {
    if (!isOpen || voices.length > 0 || fetchedVoices.length > 0) return;
    getPodcastVoices().then((list) => {
      if (Array.isArray(list) && list.length > 0) setFetchedVoices(list);
    }).catch(() => {});
  }, [isOpen, voices.length, fetchedVoices.length]);

  const activeVoices = voices.length > 0 ? voices : fetchedVoices;
  const maleVoices = activeVoices.filter((v) => v.gender === 'male');
  const femaleVoices = activeVoices.filter((v) => v.gender === 'female');
  const hasSources = sources.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!hasSources || loading) return;
    onGenerate?.();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Audio Overview"
      description="Generate a two-host audio discussion grounded in your notebook sources."
      maxWidth="480px"
    >
      <form onSubmit={handleSubmit} className="audio-dialog-form">
        {/* Length Selector */}
        <div className="audio-dialog-section">
          <div className="audio-dialog-label-row">
            <label className="audio-dialog-label">Length</label>
          </div>
          <div className="audio-segmented-control" role="radiogroup" aria-label="Episode length">
            {LENGTH_OPTIONS.map((opt) => {
              const isSelected = options.length === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  disabled={loading}
                  onClick={() => setOptions({ ...options, length: opt.id })}
                  className={`audio-segmented-btn ${isSelected ? 'active' : ''}`}
                >
                  <span className="audio-segmented-title">{opt.label}</span>
                  <span className="audio-segmented-sub">{opt.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Host Voices */}
        <div className="audio-dialog-section">
          <div className="audio-dialog-label-row">
            <label className="audio-dialog-label">Host Voices</label>
            <span className="audio-dialog-hint">Austin &amp; Taylor</span>
          </div>
          <div className="audio-voices-grid">
            <div className="audio-voice-field">
              <span className="audio-voice-sublabel">Host 1 (Austin)</span>
              <select
                value={options.voice_host1}
                disabled={loading}
                onChange={(e) => setOptions({ ...options, voice_host1: e.target.value })}
                className="audio-dialog-select"
                aria-label="Host 1 Voice"
              >
                {maleVoices.length > 0 ? (
                  maleVoices.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} ({v.accent})</option>
                  ))
                ) : (
                  <option value="am_michael">Michael (American)</option>
                )}
              </select>
            </div>

            <div className="audio-voice-field">
              <span className="audio-voice-sublabel">Host 2 (Taylor)</span>
              <select
                value={options.voice_host2}
                disabled={loading}
                onChange={(e) => setOptions({ ...options, voice_host2: e.target.value })}
                className="audio-dialog-select"
                aria-label="Host 2 Voice"
              >
                {femaleVoices.length > 0 ? (
                  femaleVoices.map((v) => (
                    <option key={v.id} value={v.id}>{v.name} ({v.accent})</option>
                  ))
                ) : (
                  <option value="af_sarah">Sarah (American)</option>
                )}
              </select>
            </div>
          </div>
        </div>

        {/* Source Scope */}
        <div className="audio-dialog-section">
          <div className="audio-dialog-label-row">
            <label className="audio-dialog-label">Sources</label>
            <span className="audio-dialog-source-count">
              <Layers size={12} />
              <span>{sources.length} {sources.length === 1 ? 'source' : 'sources'} included</span>
            </span>
          </div>

          {!hasSources ? (
            <div className="audio-dialog-empty-warning">
              Add at least one source to your notebook before generating an Audio Overview.
            </div>
          ) : sources.length > 1 ? (
            <select
              value={options.focus_source || ''}
              disabled={loading}
              onChange={(e) => setOptions({ ...options, focus_source: e.target.value })}
              className="audio-dialog-select"
              aria-label="Priority Focus Source"
            >
              <option value="">All notebook sources (balanced)</option>
              {sources.map((src, i) => (
                <option key={src.id || i} value={src.title}>
                  Focus on: {src.title || `Source ${i + 1}`}
                </option>
              ))}
            </select>
          ) : (
            <div className="audio-dialog-single-source">
              Using: {sources[0]?.title || 'Notebook source'}
            </div>
          )}
        </div>

        {/* Collapsible Advanced Settings */}
        <div className="audio-dialog-advanced">
          <button
            type="button"
            className="audio-advanced-toggle"
            onClick={() => setAdvancedOpen((prev) => !prev)}
            aria-expanded={advancedOpen}
          >
            <ChevronRight size={14} className={`audio-advanced-chevron ${advancedOpen ? 'open' : ''}`} />
            <span>Advanced Settings</span>
          </button>

          {advancedOpen && (
            <div className="audio-advanced-body">
              <div className="audio-voice-field">
                <span className="audio-voice-sublabel">Conversation Tone</span>
                <select
                  value={options.format}
                  disabled={loading}
                  onChange={(e) => setOptions({ ...options, format: e.target.value })}
                  className="audio-dialog-select"
                  aria-label="Conversation Tone"
                >
                  {FORMAT_OPTIONS.map((fmt) => (
                    <option key={fmt.id} value={fmt.id}>{fmt.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="audio-dialog-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary compact"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={!hasSources || loading}
            className="audio-generate-primary-btn"
          >
            {loading ? <Headphones size={14} /> : <Sparkles size={14} />}
            <span>{loading ? 'Generating...' : 'Generate Audio Overview'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
