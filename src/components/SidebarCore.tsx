import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  anomaliesCount: number;
}

export const SidebarCore: React.FC<SidebarProps> = ({ currentView, onChangeView, anomaliesCount }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">Locus Core</div>
        <div className="subtitle">Data Custodian Workspace</div>
      </div>

      <nav className="sidebar-nav">
        <button
          className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => onChangeView('dashboard')}
        >
          <span className="icon">📊</span>
          Dashboard
        </button>

        <button
          className={`nav-item ${currentView === 'bounties' ? 'active' : ''}`}
          onClick={() => onChangeView('bounties')}
        >
          <span className="icon">💰</span>
          Bounty Board
        </button>

        <button
          className={`nav-item ${currentView === 'campus-cup' ? 'active' : ''}`}
          onClick={() => onChangeView('campus-cup')}
        >
          <span className="icon">🏆</span>
          Campus Cup
        </button>

        <button
          className={`nav-item ${currentView === 'data-health' ? 'active' : ''}`}
          onClick={() => onChangeView('data-health')}
        >
          <span className="icon">🏥</span>
          Data Health
          {anomaliesCount > 0 && <span className="badge">{anomaliesCount}</span>}
        </button>

        <button
          className={`nav-item ${currentView === 'achievements' ? 'active' : ''}`}
          onClick={() => onChangeView('achievements')}
        >
          <span className="icon">🏆</span>
          Achievement Case
        </button>

        <div className="nav-section">Hygiene Tools</div>

        <button
          className={`nav-item ${currentView === 'duplicates' ? 'active' : ''}`}
          onClick={() => onChangeView('duplicates')}
        >
          <span className="icon">👯</span>
          Duplicate Detective
        </button>

        <button
          className={`nav-item ${currentView === 'ghosts' ? 'active' : ''}`}
          onClick={() => onChangeView('ghosts')}
        >
          <span className="icon">👻</span>
          Ghost Protocol
        </button>

        <button
          className={`nav-item ${currentView === 'families' ? 'active' : ''}`}
          onClick={() => onChangeView('families')}
        >
          <span className="icon">👨‍👩‍👧‍👦</span>
          Family Audit
        </button>

        <div className="nav-section">System</div>

        <button
          className={`nav-item ${currentView === 'integrations' ? 'active' : ''}`}
          onClick={() => onChangeView('integrations')}
        >
          <span className="icon">🔌</span>
          Integrations
        </button>

        <button
          className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => onChangeView('settings')}
        >
          <span className="icon">⚙️</span>
          Settings
        </button>
      </nav>

      <div className="sidebar-footer">
        v6.1 - Symbiotic Intelligence
      </div>
    </div>
  );
};
