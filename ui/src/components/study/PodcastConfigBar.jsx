import React from 'react';
import { SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';

export default function PodcastConfigBar({
  options,
  setOptions,
  voices = [],
  sources = [],
  disabled = false
}) {
  const [open, setOpen] = React.useState(false);

  const maleVoices = voices.filter((v) => v.gender === 'male');
  const femaleVoices = voices.filter((v) => v.gender === 'female');

  return (
    <div style={{ backgroundColor: '#141416', border: '1px solid #27272a', borderRadius: '8px', overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={disabled}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'transparent',
          border: 'none',
          color: '#a1a1aa',
          fontSize: '0.74rem',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontWeight: 500
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <SlidersHorizontal size={13} color="#818cf8" />
          <span>Podcast Settings: </span>
          <span style={{ color: '#e4e4e7', fontWeight: 600 }}>
            {options.format.toUpperCase()} • {options.length.toUpperCase()}
          </span>
        </div>
        {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
      </button>

      {open && (
        <div style={{ padding: '12px', borderTop: '1px solid #27272a', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.66rem', color: '#71717a', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Format & Tone</label>
            <select
              value={options.format}
              onChange={(e) => setOptions({ ...options, format: e.target.value })}
              style={{ width: '100%', backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px', color: '#f4f4f5', padding: '5px 8px', fontSize: '0.72rem' }}
            >
              <option value="banter">Casual Banter</option>
              <option value="academic">Academic Review</option>
              <option value="debate">Spirited Debate</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.66rem', color: '#71717a', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Episode Length</label>
            <select
              value={options.length}
              onChange={(e) => setOptions({ ...options, length: e.target.value })}
              style={{ width: '100%', backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px', color: '#f4f4f5', padding: '5px 8px', fontSize: '0.72rem' }}
            >
              <option value="short">Quick (1-2 mins)</option>
              <option value="standard">Standard (2-3 mins)</option>
              <option value="deep">Deep Dive (4-5 mins)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.66rem', color: '#71717a', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Host 1 Voice</label>
            <select
              value={options.voice_host1}
              onChange={(e) => setOptions({ ...options, voice_host1: e.target.value })}
              style={{ width: '100%', backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px', color: '#f4f4f5', padding: '5px 8px', fontSize: '0.72rem' }}
            >
              {maleVoices.length > 0 ? (
                maleVoices.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.accent})</option>
                ))
              ) : (
                <option value="am_adam">Adam (American)</option>
              )}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.66rem', color: '#71717a', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Host 2 Voice</label>
            <select
              value={options.voice_host2}
              onChange={(e) => setOptions({ ...options, voice_host2: e.target.value })}
              style={{ width: '100%', backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px', color: '#f4f4f5', padding: '5px 8px', fontSize: '0.72rem' }}
            >
              {femaleVoices.length > 0 ? (
                femaleVoices.map((v) => (
                  <option key={v.id} value={v.id}>{v.name} ({v.accent})</option>
                ))
              ) : (
                <option value="af_bella">Bella (American)</option>
              )}
            </select>
          </div>

          {sources.length > 1 && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.66rem', color: '#71717a', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Priority Focus Source (Optional)</label>
              <select
                value={options.focus_source || ''}
                onChange={(e) => setOptions({ ...options, focus_source: e.target.value })}
                style={{ width: '100%', backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '6px', color: '#f4f4f5', padding: '5px 8px', fontSize: '0.72rem' }}
              >
                <option value="">All Notebook Sources (Balanced)</option>
                {sources.map((src, i) => (
                  <option key={src.id || i} value={src.title}>{src.title || `Source ${i + 1}`}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
