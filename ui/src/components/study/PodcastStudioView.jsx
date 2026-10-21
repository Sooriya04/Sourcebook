import React, { useRef, useEffect } from 'react';
import { Radio, Mic2 } from 'lucide-react';

export default function PodcastStudioView({ turns = [], activeTurnIdx = -1, isPlaying = false }) {
  const canvasRef = useRef(null);
  const animRef = useRef(null);

  const activeTurn = turns[activeTurnIdx] || null;
  const isAustin = activeTurn && (activeTurn.speaker === 'austin' || activeTurn.speaker === 'host1');
  const isTaylor = activeTurn && (activeTurn.speaker === 'taylor' || activeTurn.speaker === 'host2');

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = (canvas.width = canvas.offsetWidth);
    const height = (canvas.height = canvas.offsetHeight);

    const barsCount = 42;
    const gap = 3;
    const barWidth = (width - gap * (barsCount - 1)) / barsCount;
    const waveData = Array.from({ length: barsCount }, () => Math.random() * 18 + 4);

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < barsCount; i++) {
        if (isPlaying) {
          waveData[i] += (Math.random() - 0.5) * 5;
          waveData[i] = Math.max(4, Math.min(height - 8, waveData[i]));
        } else {
          waveData[i] = waveData[i] * 0.92 + 4 * 0.08;
        }

        const barHeight = waveData[i];
        const x = i * (barWidth + gap);
        const y = (height - barHeight) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
        if (isAustin) {
          grad.addColorStop(0, '#38bdf8');
          grad.addColorStop(1, '#0284c7');
        } else if (isTaylor) {
          grad.addColorStop(0, '#ec4899');
          grad.addColorStop(1, '#be185d');
        } else {
          grad.addColorStop(0, '#818cf8');
          grad.addColorStop(1, '#6366f1');
        }

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 3);
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => animRef.current && cancelAnimationFrame(animRef.current);
  }, [isPlaying, isAustin, isTaylor]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {/* Live Audio Visualizer Card */}
      <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', padding: '16px 20px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={15} color={isPlaying ? '#22c55e' : '#71717a'} />
            <span style={{ fontSize: '0.74rem', fontWeight: 600, color: '#f4f4f5', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
              {isPlaying ? 'Live Audio Waveform' : 'Audio Visualizer (Idle)'}
            </span>
          </div>
          {activeTurn && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#22c55e', display: 'inline-block' }} />
              <span style={{ fontSize: '0.68rem', fontWeight: 600, color: isAustin ? '#38bdf8' : '#ec4899' }}>
                ON AIR: {activeTurn.name || (isAustin ? 'Austin' : 'Taylor')}
              </span>
            </div>
          )}
        </div>

        <div style={{ height: '76px', width: '100%', backgroundColor: '#121214', borderRadius: '8px', padding: '10px 14px', border: '1px solid #27272a' }}>
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>
      </div>

      {/* Host Booth Cards */}
      <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', padding: '16px', borderRadius: '12px' }}>
        <h5 style={{ margin: '0 0 12px 0', fontSize: '0.76rem', fontWeight: 600, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          <Mic2 size={13} color="#818cf8" />
          <span>Co-Host Studio Booth</span>
        </h5>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
          <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#121214', border: isAustin && isPlaying ? '1px solid #38bdf8' : '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#38bdf8' }}>Austin</span>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.68rem', color: '#71717a' }}>Big Picture & Framing</p>
            </div>
            <span style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: isAustin && isPlaying ? 'rgba(56, 189, 248, 0.2)' : '#27272a', color: isAustin && isPlaying ? '#38bdf8' : '#71717a', fontWeight: 600 }}>
              {isAustin && isPlaying ? 'SPEAKING' : 'STANDBY'}
            </span>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '8px', backgroundColor: '#121214', border: isTaylor && isPlaying ? '1px solid #ec4899' : '1px solid #27272a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#ec4899' }}>Taylor</span>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.68rem', color: '#71717a' }}>Nuance & Synthesis</p>
            </div>
            <span style={{ fontSize: '0.62rem', padding: '2px 8px', borderRadius: '4px', backgroundColor: isTaylor && isPlaying ? 'rgba(236, 72, 153, 0.2)' : '#27272a', color: isTaylor && isPlaying ? '#ec4899' : '#71717a', fontWeight: 600 }}>
              {isTaylor && isPlaying ? 'SPEAKING' : 'STANDBY'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
