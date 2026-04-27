import React from 'react';
import './LandingPage.css';

export interface LandingPageProps {
  onSelectRole: (role: 'core' | 'intelligence') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectRole }) => {
  return (
    <div className="landing-page">
      <h1>Welcome to Locus</h1>
      <p>Please select your workspace</p>
      <div className="role-selection">
        <button className="role-card" onClick={() => onSelectRole('core')}>
          <h2>Locus Core</h2>
          <p>Data Custodian Workspace</p>
          <ul>
            <li>Data Hygiene</li>
            <li>Duplicates & Ghosts</li>
            <li>Gamification</li>
          </ul>
        </button>
        <button className="role-card" onClick={() => onSelectRole('intelligence')}>
          <h2>Locus Intelligence</h2>
          <p>Executive Dashboard</p>
          <ul>
            <li>Predictive Attrition</li>
            <li>Burnout Risk</li>
            <li>Boardroom Ready Analytics</li>
          </ul>
        </button>
      </div>
    </div>
  );
};
