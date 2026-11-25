import React from 'react';
import { ShieldCheck } from 'lucide-react';

const MODES = [
  {
    id: 'standard',
    title: 'Standard',
    badge: 'Balanced',
    desc: "Combines your instructions with SourceBook's default task guidance."
  },
  {
    id: 'custom_priority',
    title: 'Custom Priority',
    badge: 'Override defaults',
    desc: 'Prioritizes your instructions over conflicting configurable task defaults.'
  }
];

export default function ExecutionModeSelector({ value = 'standard', onChange }) {
  return (
    <div className="prompt-field">
      <div className="prompt-field-header">
        <span className="prompt-field-label">Execution Mode</span>
      </div>

      <div className="prompt-mode-grid" role="radiogroup" aria-label="Instruction execution mode">
        {MODES.map((mode) => {
          const active = value === mode.id;
          return (
            <button
              key={mode.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(mode.id)}
              className={`prompt-mode-card ${active ? 'active' : ''}`}
            >
              <div className="prompt-mode-top">
                <span className="prompt-mode-title">{mode.title}</span>
                <span className={`prompt-mode-badge ${mode.id === 'custom_priority' ? 'custom' : ''}`}>
                  {mode.badge}
                </span>
              </div>
              <p className="prompt-mode-desc">{mode.desc}</p>
            </button>
          );
        })}
      </div>

      <p className="prompt-policy-note">
        <ShieldCheck size={12} />
        <span>
          Custom Priority only adjusts configurable task-level guidance. Core system safety policies and grounding boundaries always remain enforced.
        </span>
      </p>
    </div>
  );
}
