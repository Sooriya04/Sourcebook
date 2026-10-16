import React from 'react';
import { GitCommit } from 'lucide-react';

export default function ExecutionTrace({ trace = [] }) {
  if (!trace || trace.length === 0) return null;

  return (
    <details
      style={{
        marginTop: '8px',
        fontSize: '0.74rem',
        border: '1px solid #27272a',
        borderRadius: '8px',
        padding: '6px 10px',
        background: 'rgba(24, 24, 27, 0.5)',
      }}
    >
      <summary
        style={{
          cursor: 'pointer',
          fontWeight: 600,
          color: '#818cf8',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          outline: 'none',
        }}
      >
        <GitCommit size={13} />
        <span>Execution Trace ({trace.length} transitions)</span>
      </summary>

      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {trace.map((step, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              borderBottom: idx < trace.length - 1 ? '1px solid rgba(39, 39, 42, 0.6)' : 'none',
              paddingBottom: '4px',
              paddingTop: '2px',
              color: '#d4d4d8',
            }}
          >
            <span>
              <strong style={{ color: '#f4f4f5' }}>Step {step.step_number}</strong>{' '}
              <span style={{ color: '#818cf8', fontFamily: "'IBM Plex Mono', monospace" }}>[{step.state}]</span>:{' '}
              {step.action || step.thought}
            </span>
            {step.duration_ms !== undefined && (
              <span style={{ color: '#71717a', fontSize: '0.68rem', flexShrink: 0, marginLeft: '8px' }}>
                {step.duration_ms}ms
              </span>
            )}
          </div>
        ))}
      </div>
    </details>
  );
}
