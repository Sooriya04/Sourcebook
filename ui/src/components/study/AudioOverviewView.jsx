import React, { useState, useEffect } from 'react';
import { Play, Pause, Volume2, Radio, Headphones } from 'lucide-react';

export default function AudioOverviewView() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
      }, 100);
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  return (
    <div className="audio-overview-view">
      <div className="podcast-player-card">
        <div className="podcast-player-header">
          <Radio size={20} className="pulse-icon" />
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h4>Deep Dive Overview</h4>
              <span style={{ fontSize: '0.62rem', background: '#374151', color: '#9ca3af', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.08)' }}>Mockup Preview</span>
            </div>
            <p>Generated Discussion • 2 Hosts</p>
          </div>
        </div>

        <div className="wave-container">
          <div className={`wave-bar ${isPlaying ? 'animating' : ''}`} style={{ height: '30px' }}></div>
          <div className={`wave-bar ${isPlaying ? 'animating' : ''}`} style={{ height: '50px', animationDelay: '0.1s' }}></div>
          <div className={`wave-bar ${isPlaying ? 'animating' : ''}`} style={{ height: '20px', animationDelay: '0.2s' }}></div>
          <div className={`wave-bar ${isPlaying ? 'animating' : ''}`} style={{ height: '45px', animationDelay: '0.3s' }}></div>
          <div className={`wave-bar ${isPlaying ? 'animating' : ''}`} style={{ height: '60px', animationDelay: '0.4s' }}></div>
          <div className={`wave-bar ${isPlaying ? 'animating' : ''}`} style={{ height: '35px', animationDelay: '0.5s' }}></div>
          <div className={`wave-bar ${isPlaying ? 'animating' : ''}`} style={{ height: '15px', animationDelay: '0.6s' }}></div>
        </div>

        <div className="player-controls">
          <button className="play-pause-btn" onClick={() => setIsPlaying(!isPlaying)}>
            {isPlaying ? <Pause size={20} /> : <Play size={20} />}
          </button>
          <div className="scrubber-bar">
            <div className="scrubber-progress" style={{ width: `${progress}%` }}></div>
          </div>
          <div className="volume-icon">
            <Volume2 size={16} />
          </div>
        </div>
      </div>

      <div className="transcript-section">
        <h5>
          <Headphones size={14} style={{ marginRight: '6px' }} />
          Discussion Transcript
        </h5>
        <div className="transcript-timeline">
          <div className="transcript-bubble speaker-a">
            <span className="speaker-name">Host 1 (Austin)</span>
            <p>Welcome back! Today we are doing a deep dive into the workspace documents. And honestly, there's some really cool stuff here about grounded AI and multi-modal models.</p>
          </div>
          <div className="transcript-bubble speaker-b">
            <span className="speaker-name">Host 2 (Taylor)</span>
            <p>Right? Especially the paper on Vision-Language-Action models. It's fascinating how they map direct visual embeddings directly to robotic actions without intermediate text planners.</p>
          </div>
          <div className="transcript-bubble speaker-a">
            <span className="speaker-name">Host 1 (Austin)</span>
            <p>Exactly! It makes you think about how crucial high-fidelity web scraping and document extraction is to feed these systems ground-truth knowledge.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
