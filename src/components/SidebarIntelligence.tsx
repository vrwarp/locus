import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
}

export const SidebarIntelligence: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">Locus Intelligence</div>
        <div className="subtitle">Executive Dashboard</div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">Intelligence</div>




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
          className={`nav-item ${currentView === 'missing' ? 'active' : ''}`}
          onClick={() => onChangeView('missing')}
        >
          <span className="icon">🚨</span>
          Missing Volunteers
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
          className={`nav-item ${currentView === 'demographics' ? 'active' : ''}`}
          onClick={() => onChangeView('demographics')}
        >
          <span className="icon">📊</span>
          Demographics
        </button>







        <button
          className={`nav-item ${currentView === 'small-groups' ? 'active' : ''}`}
          onClick={() => onChangeView('small-groups')}
        >
          <span className="icon">🧬</span>
          Small Group Sorter
        </button>

        <div className="nav-section">Tools</div>

        <button
          className={`nav-item ${currentView === 'automations' ? 'active' : ''}`}
          onClick={() => onChangeView('automations')}
        >
          <span className="icon">⚡</span>
          Automations
        </button>


      </nav>

      <div className="sidebar-footer">
        v6.1 - Symbiotic Intelligence
      </div>
    </div>
  );
};
