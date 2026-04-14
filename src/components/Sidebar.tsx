import React from 'react';
import './Sidebar.css';
import { Avatar } from './Avatar';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  anomaliesCount: number;
  totalFixes?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, anomaliesCount, totalFixes = 0 }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <Avatar totalFixes={totalFixes} />
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

        <div className="nav-section">Intelligence</div>

        <button
          className={`nav-item ${currentView === 'copilot' ? 'active' : ''}`}
          onClick={() => onChangeView('copilot')}
        >
          <span className="icon">🤖</span>
          Pastoral Co-Pilot
        </button>

        <button
          className={`nav-item ${currentView === 'small-groups' ? 'active' : ''}`}
          onClick={() => onChangeView('small-groups')}
        >
          <span className="icon">🧬</span>
          Small Group Sorter
        </button>

        <button
          className={`nav-item ${currentView === 'global-pulse' ? 'active' : ''}`}
          onClick={() => onChangeView('global-pulse')}
        >
          <span className="icon">🌍</span>
          Global Pulse
        </button>

        <button
          className={`nav-item ${currentView === 'newsletter' ? 'active' : ''}`}
          onClick={() => onChangeView('newsletter')}
        >
          <span className="icon">📰</span>
          Newsletter Architect
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
          onClick={() => onChangeView('attrition')}>
        <span className="icon">📉</span>
        Attrition
      </button>

        <button
          className={`nav-item ${currentView === 'missing' ? 'active' : ''}`}
          onClick={() => onChangeView('missing')}
        >
          <span className="icon">🚨</span>
          Missing Volunteers
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
          className={`nav-item ${currentView === 'velocity' ? 'active' : ''}`}
          onClick={() => onChangeView('velocity')}
        >
          <span className="icon">⏱️</span>
          Check-in Velocity
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
          className={`nav-item ${currentView === 'solar-system' ? 'active' : ''}`}
          onClick={() => onChangeView('solar-system')}
        >
          <span className="icon">🪐</span>
          Solar System
        </button>

        <button
          className={`nav-item ${currentView === 'achievements' ? 'active' : ''}`}
          onClick={() => onChangeView('achievements')}
        >
          <span className="icon">🏆</span>
          Achievement Case
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
        <button
          className={`nav-item ${currentView === 'map-view' ? 'active' : ''}`}
          onClick={() => onChangeView('map-view')}
        >
          <span className="icon">🗺️</span>
          Map View
        </button>
        <button
          className={`nav-item ${currentView === 'sermons' ? 'active' : ''}`}
          onClick={() => onChangeView('sermons')}
        >
          <span className="icon">📖</span>
          Sermon Sentiment
        </button>

        <button
          className={`nav-item ${currentView === 'giving-river' ? 'active' : ''}`}
          onClick={() => onChangeView('giving-river')}
        >
          <span className="icon">🌊</span>
          Giving River
        </button>

        <button
          className={`nav-item ${currentView === 'giving-trends' ? 'active' : ''}`}
          onClick={() => onChangeView('giving-trends')}
        >
          <span className="icon">💳</span>
          Stripe Trends
        </button>

        <button
          className={`nav-item ${currentView === 'prayer' ? 'active' : ''}`}
          onClick={() => onChangeView('prayer')}
        >
          <span className="icon">🙏</span>
          Prayer Partner Match
        </button>

        <div className="nav-section">Tools</div>

        <button
          className={`nav-item ${currentView === 'automations' ? 'active' : ''}`}
          onClick={() => onChangeView('automations')}
        >
          <span className="icon">⚡</span>
          Automations
        </button>

        <button
          className={`nav-item ${currentView === 'emergency' ? 'active' : ''}`}
          onClick={() => onChangeView('emergency')}
        >
          <span className="icon">🚨</span>
          Emergency Alerts
        </button>

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
