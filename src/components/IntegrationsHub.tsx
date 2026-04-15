import React from 'react';
import type { AppConfig } from '../utils/storage';
import './IntegrationsHub.css';

interface IntegrationsHubProps {
  config: AppConfig;
  onSaveConfig: (newConfig: AppConfig) => void;
}

export const IntegrationsHub: React.FC<IntegrationsHubProps> = ({ config, onSaveConfig }) => {
  const integrations = config.integrations || {};

  const handleToggle = (key: keyof typeof integrations) => {
    const newConfig = {
      ...config,
      integrations: {
        ...integrations,
        [key]: !integrations[key]
      }
    };
    onSaveConfig(newConfig);
  };

  const renderCard = (title: string, key: keyof typeof integrations, description: string, activeText: string) => {
    const isActive = !!integrations[key];
    return (
      <div className={`integration-card ${isActive ? 'active' : ''}`} key={key}>
        <div className="card-header">
          <h3>{title}</h3>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isActive}
              onChange={() => handleToggle(key)}
              data-testid={`toggle-${key}`}
            />
            <span className="slider"></span>
          </label>
        </div>
        <p className="description">{description}</p>
        {isActive && (
          <div className="status active">
            <span className="status-icon">✅</span>
            <span className="status-text">{activeText}</span>
          </div>
        )}
        {!isActive && (
          <div className="status disabled">
            <span className="status-text">Disconnected</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="integrations-hub">
      <div className="hub-header">
        <h1>Locus Integrations</h1>
        <p>Connect your favorite tools to Locus to synchronize and health-check data across your ecosystem.</p>
      </div>

      <div className="integrations-grid">
        {renderCard('Mailchimp', 'mailchimp', 'Sync tags and lists based on data health score. Automatically pause sends to ghosts.', 'Syncing 423 profiles. 12 ghosts paused.')}
        {renderCard('Zoom', 'zoom', 'Track attendance for online small groups automatically by matching emails to Zoom registrants.', 'Listening for meeting webhooks...')}
        {renderCard('Eventbrite', 'eventbrite', 'Sync ticket sales to PCO profiles, ensuring contact information is up to date.', 'Event "Fall Retreat" mapped. 54 tickets synced.')}
        {renderCard('Typeform', 'typeform', 'Feed survey responses directly into custom profile fields in Locus / PCO.', '2 active surveys mapped.')}
      </div>
    </div>
  );
};
