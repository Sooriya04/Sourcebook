import React from 'react';
import { Headphones } from 'lucide-react';

export default function PodcastTranscript({ turns = [], activeTurnIdx = -1, onJumpToTurn, formatTime }) {
  return (
    <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', padding: '16px', borderRadius: '12px' }}>
      <h5 style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 12px 0' }}>
        <Headphones size={15} color="#818cf8" />
        <span>Discussion Transcript</span>
      </h5>

      {turns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '24px 12px', color: '#71717a', fontSize: '0.8rem' }}>
          <p style={{ margin: 0 }}>Click <strong>Generate Overview</strong> to synthesize a 2-host audio podcast from your sources.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {turns.map((turn, idx) => {
            const isActive = activeTurnIdx === idx;
            const isAustin = turn.speaker === 'austin' || turn.speaker === 'host1';
            return (
              <div
                key={idx}
                onClick={() => onJumpToTurn(turn.start_time || 0)}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  backgroundColor: isActive ? '#27272a' : '#121214',
                  borderLeft: isAustin ? '3px solid #38bdf8' : '3px solid #ec4899',
                  borderTop: '1px solid #27272a',
                  borderRight: '1px solid #27272a',
                  borderBottom: '1px solid #27272a'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ fontSize: '0.7rem', fontWeight: 600, color: isAustin ? '#38bdf8' : '#ec4899', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {turn.name || (isAustin ? 'Austin' : 'Taylor')}
                  </span>
                  {turn.start_time !== undefined && (
                    <span style={{ fontSize: '0.65rem', color: '#71717a', fontFamily: "'IBM Plex Mono', monospace" }}>
                      {formatTime(turn.start_time)}
                    </span>
                  )}
                </div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#e4e4e7', lineHeight: 1.45 }}>{turn.text}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
