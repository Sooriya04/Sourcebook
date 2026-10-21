import React from 'react';
import { Sparkles, FileText, CheckCircle2, Clock } from 'lucide-react';

export default function NotebookLMAudioStudio({
  summary = '',
  takeaways = [],
  turns = [],
  sources = [],
  onJumpToTime,
  formatTime
}) {
  // Generate chapter timestamps from turns if available
  const chapters = turns
    .filter((_, idx) => idx === 0 || idx % 3 === 0)
    .map((turn, i) => ({
      title: turn.text.length > 55 ? `${turn.text.slice(0, 52)}...` : turn.text,
      time: turn.start_time || 0,
      host: turn.name || (turn.speaker === 'austin' ? 'Austin' : 'Taylor')
    }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Executive Brief Card */}
      <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', padding: '18px 20px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Sparkles size={15} color="#818cf8" />
          <h5 style={{ margin: 0, fontSize: '0.84rem', fontWeight: 600, color: '#f4f4f5', letterSpacing: '-0.01em' }}>
            NotebookLM Episode Brief
          </h5>
        </div>
        <p style={{ margin: 0, fontSize: '0.8rem', color: '#d4d4d8', lineHeight: 1.55 }}>
          {summary || "Austin and Taylor conduct a comprehensive deep dive into your notebook's knowledge assets, synthesizing core principles, architectural insights, and strategic takeaways."}
        </p>
      </div>

      {/* Core Takeaways Card */}
      <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', padding: '18px 20px', borderRadius: '12px' }}>
        <h5 style={{ margin: '0 0 12px 0', fontSize: '0.78rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <CheckCircle2 size={13} color="#22c55e" />
          <span>Core Takeaways</span>
        </h5>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {takeaways && takeaways.length > 0 ? (
            takeaways.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#818cf8', marginTop: '6px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', color: '#e4e4e7', lineHeight: 1.45 }}>{item}</span>
              </div>
            ))
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#818cf8', marginTop: '6px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', color: '#e4e4e7', lineHeight: 1.45 }}>Grounded knowledge structures synthesize disjointed documents into high-cohesion reasoning concepts.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#818cf8', marginTop: '6px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', color: '#e4e4e7', lineHeight: 1.45 }}>Dual-host perspective cross-examines methodologies and tests key empirical assumptions.</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#818cf8', marginTop: '6px', flexShrink: 0 }} />
                <span style={{ fontSize: '0.78rem', color: '#e4e4e7', lineHeight: 1.45 }}>Actionable takeaways focus on concrete engineering implementations and reliability.</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Chapters & Sources Cited Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
        {/* Topic Chapters */}
        <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', padding: '16px', borderRadius: '12px' }}>
          <h5 style={{ margin: '0 0 10px 0', fontSize: '0.74rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={13} color="#818cf8" />
            <span>Episode Chapters</span>
          </h5>

          {chapters.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.74rem', color: '#71717a' }}>Chapters appear here when audio is generated.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {chapters.map((chap, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onJumpToTime(chap.time)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    backgroundColor: '#121214',
                    border: '1px solid #27272a',
                    cursor: 'pointer',
                    color: '#e4e4e7',
                    fontSize: '0.72rem',
                    textAlign: 'left',
                    width: '100%'
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3f3f46')}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#27272a')}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                    {chap.host}: {chap.title}
                  </span>
                  <span style={{ fontSize: '0.64rem', color: '#818cf8', fontFamily: "'IBM Plex Mono', monospace" }}>
                    {formatTime(chap.time)}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Sources Cited */}
        <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', padding: '16px', borderRadius: '12px' }}>
          <h5 style={{ margin: '0 0 10px 0', fontSize: '0.74rem', fontWeight: 600, color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={13} color="#818cf8" />
            <span>Sources Consulted ({sources.length})</span>
          </h5>

          {sources.length === 0 ? (
            <p style={{ margin: 0, fontSize: '0.74rem', color: '#71717a' }}>No sources found in notebook.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', maxHeight: '110px', overflowY: 'auto' }}>
              {sources.map((src, i) => (
                <span
                  key={src.id || i}
                  style={{
                    fontSize: '0.68rem',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#121214',
                    border: '1px solid #27272a',
                    color: '#a1a1aa',
                    maxWidth: '100%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {src.title || `Source ${i + 1}`}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
