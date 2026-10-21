import React from 'react';
import { Sparkles, Mic, Loader2 } from 'lucide-react';

export default function PodcastProgressTracker({ statusInfo }) {
  if (!statusInfo) return null;

  const { step, message, turn_index = 0, total_turns = 1, speaker, name } = statusInfo;
  const percent = total_turns > 0 && step === 'turn_done' 
    ? Math.round(((turn_index + 1) / total_turns) * 100)
    : step === 'drafting' ? 20 : 50;

  return (
    <div style={{ backgroundColor: '#141416', border: '1px solid #3f3f46', borderRadius: '8px', padding: '12px 14px', marginBottom: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: '#f4f4f5', fontWeight: 500 }}>
          {step === 'turn_done' ? <Mic size={14} color="#ec4899" /> : <Sparkles size={14} color="#818cf8" />}
          <span>{message || (step === 'turn_done' ? `Synthesizing ${name || speaker} (Turn ${turn_index + 1}/${total_turns})...` : 'Generating dialogue...')}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#a1a1aa', fontFamily: "'IBM Plex Mono', monospace" }}>
          <Loader2 size={12} className="spin-icon" />
          <span>{percent}%</span>
        </div>
      </div>

      <div style={{ width: '100%', height: '4px', backgroundColor: '#27272a', borderRadius: '2px', overflow: 'hidden' }}>
        <div
          style={{
            width: `${percent}%`,
            height: '100%',
            backgroundColor: '#818cf8',
            borderRadius: '2px',
            transition: 'width 0.3s ease'
          }}
        />
      </div>
    </div>
  );
}
