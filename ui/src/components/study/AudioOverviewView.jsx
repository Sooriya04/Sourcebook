import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2, Radio, Headphones, Settings2 } from 'lucide-react';

export default function AudioOverviewView() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [activeVoice, setActiveVoice] = useState('both'); // 'both', 'austin', 'taylor'
  
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Scrubber timer reacting to speed
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 0.3 * speed;
          return next >= 100 ? 0 : next;
        });
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isPlaying, speed]);

  // Waveform canvas animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let width = canvas.width = canvas.offsetWidth;
    let height = canvas.height = canvas.offsetHeight;
    
    let barsCount = 45;
    let barWidth = width / barsCount - 3;
    let waveData = Array.from({ length: barsCount }, () => Math.random() * 20 + 5);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      
      for (let i = 0; i < barsCount; i++) {
        // if playing, slightly fluctuate heights
        if (isPlaying) {
          waveData[i] = waveData[i] + (Math.random() - 0.5) * 4;
          // boundaries
          waveData[i] = Math.max(4, Math.min(height - 10, waveData[i]));
        } else {
          // calm down to flat state
          waveData[i] = waveData[i] * 0.95 + 4 * 0.05;
        }

        const barHeight = waveData[i];
        const x = i * (barWidth + 3);
        const y = (height - barHeight) / 2;

        // Gradient coloring
        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (activeVoice === 'austin') {
          grad.addColorStop(0, '#38bdf8');
          grad.addColorStop(1, '#0284c7');
        } else if (activeVoice === 'taylor') {
          grad.addColorStop(0, '#ec4899');
          grad.addColorStop(1, '#be185d');
        } else {
          grad.addColorStop(0, '#818cf8');
          grad.addColorStop(1, '#38bdf8');
        }

        ctx.fillStyle = grad;
        // Draw rounded rectangle bars
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, activeVoice]);

  return (
    <div className="audio-overview-view" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="podcast-player-card glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '24px', borderRadius: '16px' }}>
        <div className="podcast-player-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Radio size={22} className="pulse-icon" style={{ color: 'var(--accent-primary)' }} />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>Deep Dive Overview</h4>
              <span style={{ fontSize: '0.62rem', background: 'var(--canvas-2)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold', border: '1px solid var(--border-color)' }}>AI Co-Hosts</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>Synthesized discussion from your notebook materials</p>
          </div>
        </div>

        {/* Waveform Visualizer Canvas */}
        <div style={{ background: 'var(--canvas-2)', borderRadius: '12px', padding: '12px 16px', height: '90px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>

        {/* Controls Layout */}
        <div className="player-controls" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button 
            className="play-pause-btn" 
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: 'var(--accent-primary)',
              border: 'none',
              color: 'var(--canvas)',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)',
              transition: 'transform 0.1s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.92)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>
          
          <div className="scrubber-bar" style={{ flex: 1, height: '6px', background: 'var(--border-color)', borderRadius: '3px', position: 'relative', overflow: 'hidden' }}>
            <div className="scrubber-progress" style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-primary)' }}></div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Speed Multiplier Button */}
            <button 
              onClick={() => setSpeed(s => s >= 2.0 ? 1.0 : s + 0.25)}
              style={{
                background: 'var(--canvas-2)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--canvas-2)'}
            >
              {speed.toFixed(2)}x
            </button>

            {/* Voice Control Options dropdown / cycle */}
            <button
              onClick={() => setActiveVoice(v => v === 'both' ? 'austin' : v === 'austin' ? 'taylor' : 'both')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                background: 'var(--canvas-2)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.72rem',
                color: 'var(--text-muted)',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--canvas-2)'}
            >
              <Settings2 size={12} />
              <span style={{ textTransform: 'capitalize' }}>{activeVoice === 'both' ? 'Dual Host' : activeVoice}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="transcript-section glass-card" style={{ padding: '20px', borderRadius: '16px' }}>
        <h5 style={{ fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          <Headphones size={16} style={{ color: 'var(--accent-primary)' }} />
          Discussion Transcript
        </h5>
        <div className="transcript-timeline" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {(activeVoice === 'both' || activeVoice === 'austin') && (
            <div className="transcript-bubble speaker-a" style={{ background: 'var(--canvas-2)', borderLeft: '3px solid var(--accent-primary)', padding: '12px', borderRadius: '8px' }}>
              <span className="speaker-name" style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>Host 1 (Austin)</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: '1.5' }}>Welcome back! Today we are doing a deep dive into the workspace documents. And honestly, there's some really cool stuff here about grounded AI and multi-modal models.</p>
            </div>
          )}
          {(activeVoice === 'both' || activeVoice === 'taylor') && (
            <div className="transcript-bubble speaker-b" style={{ background: 'var(--canvas-2)', borderLeft: '3px solid #ec4899', padding: '12px', borderRadius: '8px' }}>
              <span className="speaker-name" style={{ fontSize: '0.72rem', fontWeight: 'bold', color: '#ec4899', textTransform: 'uppercase' }}>Host 2 (Taylor)</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: '1.5' }}>Right? Especially the paper on Vision-Language-Action models. It's fascinating how they map direct visual embeddings directly to robotic actions without intermediate text planners.</p>
            </div>
          )}
          {(activeVoice === 'both' || activeVoice === 'austin') && (
            <div className="transcript-bubble speaker-a" style={{ background: 'var(--canvas-2)', borderLeft: '3px solid var(--accent-primary)', padding: '12px', borderRadius: '8px' }}>
              <span className="speaker-name" style={{ fontSize: '0.72rem', fontWeight: 'bold', color: 'var(--accent-primary)', textTransform: 'uppercase' }}>Host 1 (Austin)</span>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: '1.5' }}>Exactly! It makes you think about how crucial high-fidelity web scraping and document extraction is to feed these systems ground-truth knowledge.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
