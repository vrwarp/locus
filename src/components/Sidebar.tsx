import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  anomaliesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, anomaliesCount }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Locus</h2>
        <div className="subtitle">Ministry Intelligence</div>
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
          className={`nav-item ${currentView === 'data-health' ? 'active' : ''}`}
          onClick={() => onChangeView('data-health')}
        >
          <span className="icon">🏥</span>
          Data Health
          {anomaliesCount > 0 && <span className="badge">{anomaliesCount}</span>}
        </button>

        <div className="nav-section">Intelligence</div>

        <button
          className={`nav-item ${currentView === 'copilot' ? 'active' : ''}`}
          onClick={() => onChangeView('copilot')}
        >
          <span className="icon">🤖</span>
          Pastoral Co-Pilot
        </button>

        <button
          className={`nav-item ${currentView === 'burnout' ? 'active' : ''}`}
          onClick={() => onChangeView('burnout')}
        >
          <span className="icon">🔥</span>
          Burnout Risk
        </button>

        <button
          className={`nav-item ${currentView === 'attrition' ? 'active' : ''}`}
          onClick={() => onChangeView('attrition')}
        >
          <span className="icon">📉</span>
          Attrition
        </button>

        <button
          className={`nav-item ${currentView === 'recruitment' ? 'active' : ''}`}
          onClick={() => onChangeView('recruitment')}
        >
          <span className="icon">🔍</span>
          Recruitment
        </button>

        <button
          className={`nav-item ${currentView === 'retention' ? 'active' : ''}`}
          onClick={() => onChangeView('retention')}
        >
          <span className="icon">🕳️</span>
          Retention
        </button>

        <button
          className={`nav-item ${currentView === 'attendance' ? 'active' : ''}`}
          onClick={() => onChangeView('attendance')}
        >
          <span className="icon">📈</span>
          Attendance
        </button>

        <button
          className={`nav-item ${currentView === 'bus-factor' ? 'active' : ''}`}
          onClick={() => onChangeView('bus-factor')}
        >
          <span className="icon">🚌</span>
          Bus Factor
        </button>

        <button
          className={`nav-item ${currentView === 'network' ? 'active' : ''}`}
          onClick={() => onChangeView('network')}
        >
          <span className="icon">🕸️</span>
          Volunteer Web
        </button>

        <button
          className={`nav-item ${currentView === 'heatmap' ? 'active' : ''}`}
          onClick={() => onChangeView('heatmap')}
        >
          <span className="icon">🎂</span>
          Birthdays
        </button>

        <button
          className={`nav-item ${currentView === 'demographics' ? 'active' : ''}`}
          onClick={() => onChangeView('demographics')}
        >
          <span className="icon">📊</span>
          Demographics
        </button>

        <div className="nav-section">Tools</div>

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
