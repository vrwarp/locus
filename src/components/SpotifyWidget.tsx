import React, { useState } from 'react';
import type { AppConfig } from '../utils/storage';
import './SpotifyWidget.css';

interface SpotifyWidgetProps {
  config: AppConfig;
}

export const SpotifyWidget: React.FC<SpotifyWidgetProps> = ({ config }) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!config.enableSpotify) return null;

  return (
    <div className={`spotify-widget ${isMinimized ? 'minimized' : ''}`}>
      <div className="spotify-widget-header">
        <span>🎧 Worship Playlist</span>
        <button onClick={() => setIsMinimized(!isMinimized)}>
          {isMinimized ? '▲' : '▼'}
        </button>
      </div>
      {!isMinimized && (
        <div className="spotify-widget-content">
          <iframe
            title="Spotify Playlist"
            style={{ borderRadius: '12px' }}
            src="https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0"
            width="100%"
            height="152"
            frameBorder="0"
            allowFullScreen={false}
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          ></iframe>
        </div>
      )}
    </div>
  );
};
