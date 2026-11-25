import React from 'react';
import { Sparkles, Mic, Loader2 } from 'lucide-react';

export default function PodcastProgressTracker({ statusInfo }) {
  if (!statusInfo) return null;

  const { step, message, turn_index = 0, total_turns = 0, speaker, name } = statusInfo;
  const hasRealProgress = step === 'turn_done' && total_turns > 0;
  const percent = hasRealProgress ? Math.round(((turn_index + 1) / total_turns) * 100) : null;

  const label =
    message ||
    (hasRealProgress
      ? `Synthesizing ${name || speaker} (Turn ${turn_index + 1}/${total_turns})...`
      : 'Generating audio overview...');

  return (
    <div className="audio-progress-box" role="status" aria-live="polite">
      <div className="audio-progress-row">
        <div className="audio-progress-label">
          {step === 'turn_done' ? <Mic size={13} /> : <Sparkles size={13} />}
          <span>{label}</span>
        </div>

        <div className="audio-progress-meta">
          <Loader2 size={12} className="spin-icon" />
          {percent !== null && <span>{percent}%</span>}
        </div>
      </div>

      <div className="audio-progress-track">
        {percent !== null ? (
          <div className="audio-progress-fill" style={{ width: `${percent}%` }} />
        ) : (
          <div className="audio-progress-indeterminate" />
        )}
      </div>
    </div>
  );
}
