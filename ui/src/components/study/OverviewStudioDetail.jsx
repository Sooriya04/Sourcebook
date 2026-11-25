import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

function CollapsibleSection({ title, defaultOpen = false, badge, children }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="audio-detail-section">
      <button
        type="button"
        className="audio-detail-toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
      >
        <div className="audio-detail-toggle-left">
          <ChevronRight size={14} className={`audio-advanced-chevron ${open ? 'open' : ''}`} />
          <span className="audio-detail-title">{title}</span>
        </div>
        {badge && <span className="audio-detail-badge">{badge}</span>}
      </button>

      {open && <div className="audio-detail-body">{children}</div>}
    </div>
  );
}

export default function OverviewStudioDetail({
  summary = '',
  takeaways = [],
  turns = [],
  onJumpToTime,
  formatTime
}) {
  const hasContent = Boolean(summary) || takeaways.length > 0 || turns.length > 0;
  if (!hasContent) return null;

  return (
    <div className="audio-details-stack">
      {summary && (
        <CollapsibleSection title="Episode Summary" defaultOpen={true}>
          <p className="audio-summary-text">{summary}</p>
        </CollapsibleSection>
      )}

      {takeaways.length > 0 && (
        <CollapsibleSection
          title="Key Takeaways"
          defaultOpen={false}
          badge={`${takeaways.length}`}
        >
          <ul className="audio-takeaways-list">
            {takeaways.map((item, idx) => (
              <li key={idx} className="audio-takeaway-item">
                {item}
              </li>
            ))}
          </ul>
        </CollapsibleSection>
      )}

      {turns.length > 0 && (
        <CollapsibleSection
          title="Transcript"
          defaultOpen={false}
          badge={`${turns.length} turns`}
        >
          <div className="audio-transcript-list">
            {turns.map((turn, idx) => {
              const speakerName = turn.name || (turn.speaker === 'austin' ? 'Austin' : 'Taylor');
              const isHost1 = (turn.speaker || '').toLowerCase() === 'austin' || idx % 2 === 0;
              return (
                <div key={idx} className="audio-transcript-turn">
                  <div className="audio-transcript-turn-meta">
                    <span className={`audio-transcript-speaker ${isHost1 ? 'host1' : 'host2'}`}>
                      {speakerName}
                    </span>
                    {turn.start_time !== undefined && (
                      <button
                        type="button"
                        onClick={() => onJumpToTime?.(turn.start_time)}
                        className="audio-transcript-time-btn"
                        title="Jump to timestamp"
                      >
                        {formatTime(turn.start_time)}
                      </button>
                    )}
                  </div>
                  <p className="audio-transcript-text">{turn.text}</p>
                </div>
              );
            })}
          </div>
        </CollapsibleSection>
      )}
    </div>
  );
}
