import React from 'react';

export default function YtVideoPlayer({ videoId, title, playerRef }) {
  return (
    <div className="ytc-player-wrapper">
      <div className="ytc-iframe-container">
        <iframe
          ref={playerRef}
          src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1&autoplay=0&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="ytc-iframe"
        />
      </div>
    </div>
  );
}
