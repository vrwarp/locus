import React from 'react';
import './Sidebar.css';

interface SidebarProps {
  currentView: string;
  onChangeView: (view: string) => void;
  anomaliesCount: number;
  readOnly: boolean;
  onToggleReadOnly: (readOnly: boolean) => void;
}

interface NavItem {
  view: string;
  label: string;
  icon: string;
  /** Leads somewhere that writes to Planning Center. Hidden in read-only mode. */
  writes?: boolean;
  badge?: boolean;
}

/**
 * One sidebar, replacing two.
 *
 * Locus used to be two workspaces — Core for fixing records, Intelligence for
 * reporting on them — chosen from a picker that appeared *before* anyone had
 * entered a credential. Each had its own sidebar, its own layout and its own
 * auth overlay wrapped around the same data and the same fetch.
 *
 * Once the audit's cuts landed there was nothing left on the Intelligence side
 * that Core could not simply contain: the analytics section went from eight rows
 * to zero, the content section dissolved, and the two write-capable screens that
 * had somehow ended up on the read-only surface were deleted. What remained was
 * a duplicated shell around a filtered view of Core.
 *
 * So the split is a mode now, not a workspace, and it is set after logging in by
 * the person who knows which they want — not guessed at by someone who has not
 * seen the app yet.
 */
const WORKSPACE: NavItem[] = [
  { view: 'dashboard', label: 'Dashboard', icon: '📊' },
  { view: 'data-health', label: 'Data Health', icon: '🏥', writes: true, badge: true },
  { view: 'duplicates', label: 'Duplicate Detective', icon: '👯', writes: true },
  { view: 'ghosts', label: 'Ghost Protocol', icon: '👻', writes: true },
  { view: 'families', label: 'Family Audit', icon: '👨‍👩‍👧‍👦', writes: true },
];

const REPORTS: NavItem[] = [
  { view: 'drift', label: 'Drift Report', icon: '⚓' },
  { view: 'retention', label: 'Retention', icon: '🕳️' },
  { view: 'attendance', label: 'Attendance', icon: '📈' },
  { view: 'burnout', label: 'Burnout Risk', icon: '🔥' },
  { view: 'missing', label: 'Missing Volunteers', icon: '🚨' },
  { view: 'recruitment', label: 'Recruitment', icon: '🔍' },
  { view: 'bus-factor', label: 'Bus Factor', icon: '🚌' },
  { view: 'demographics', label: 'Demographics', icon: '📊' },
];

const TOOLS: NavItem[] = [
  { view: 'automations', label: 'Automations', icon: '⚡', writes: true },
  { view: 'small-groups', label: 'Small Group Sorter', icon: '🧬' },
  { view: 'newsletter', label: 'Weekly Update', icon: '📰' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentView, onChangeView, anomaliesCount, readOnly, onToggleReadOnly
}) => {
  const section = (title: string, items: NavItem[]) => {
    const visible = items.filter(item => !(readOnly && item.writes));
    if (visible.length === 0) return null;
    return (
      <>
        <div className="nav-section">{title}</div>
        {visible.map(item => (
          <button
            key={item.view}
            className={`nav-item ${currentView === item.view ? 'active' : ''}`}
            onClick={() => onChangeView(item.view)}
          >
            <span className="icon">{item.icon}</span>
            {item.label}
            {item.badge && anomaliesCount > 0 && <span className="badge">{anomaliesCount}</span>}
          </button>
        ))}
      </>
    );
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="logo">Locus</div>
        <div className="subtitle">{readOnly ? 'Reporting' : 'Data workspace'}</div>
      </div>

      <nav className="sidebar-nav">
        {section('Records', WORKSPACE)}
        {section('Reports', REPORTS)}
        {section('Tools', TOOLS)}

        <div className="nav-section">System</div>
        <button
          className={`nav-item ${currentView === 'settings' ? 'active' : ''}`}
          onClick={() => onChangeView('settings')}
        >
          <span className="icon">⚙️</span>
          Settings
        </button>
      </nav>

      <div className="sidebar-footer">
        <label className="readonly-toggle">
          <input
            type="checkbox"
            checked={readOnly}
            onChange={(e) => onToggleReadOnly(e.target.checked)}
          />
          Read-only
        </label>
        <p className="readonly-note">
          {readOnly
            ? 'Editing screens are hidden and writes are refused.'
            : 'Editing screens can change Planning Center records.'}
        </p>
      </div>
    </div>
  );
};
