import React, { useState } from 'react';
import { Bookmark, List, Search } from 'lucide-react';

export default function YtTranscriptSidebar({ chapters = [], transcript = [], onSeek }) {
  const [activeTab, setActiveTab] = useState('chapters');
  const [filterQuery, setFilterQuery] = useState('');

  const filteredTranscript = transcript.filter((t) =>
    t.text.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="ytc-transcript-sidebar">
      <div className="ytc-transcript-nav">
        <div className="ytc-tab-pill-group">
          <button
            type="button"
            className={`ytc-tab-pill ${activeTab === 'chapters' ? 'active' : ''}`}
            onClick={() => setActiveTab('chapters')}
          >
            <Bookmark size={13} />
            <span>Chapters ({chapters.length})</span>
          </button>
          <button
            type="button"
            className={`ytc-tab-pill ${activeTab === 'transcript' ? 'active' : ''}`}
            onClick={() => setActiveTab('transcript')}
          >
            <List size={13} />
            <span>Transcript</span>
          </button>
        </div>

        {activeTab === 'transcript' && (
          <div className="ytc-search-bar">
            <Search size={12} className="text-zinc-500" />
            <input
              type="text"
              placeholder="Search transcript..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="ytc-search-input"
            />
          </div>
        )}
      </div>

      <div className="ytc-transcript-content-scroll">
        {activeTab === 'chapters' ? (
          <div className="ytc-chapters-grid">
            {chapters.map((chap, i) => (
              <button
                key={i}
                type="button"
                className="ytc-chapter-card"
                onClick={() => onSeek(chap.seconds)}
              >
                <span className="ytc-time-pill">{chap.timestamp}</span>
                <span className="ytc-chapter-name">{chap.title}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="ytc-transcript-stream">
            {filteredTranscript.map((seg, i) => (
              <div
                key={i}
                className="ytc-transcript-row"
                onClick={() => onSeek(seg.seconds)}
              >
                <span className="ytc-time-pill small">{seg.timestamp}</span>
                <p className="ytc-seg-text">{seg.text}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
