import React from 'react';
import { Sidebar } from '../components/Sidebar';

interface AppLayoutProps {
  currentView: string;
  onChangeView: (view: string) => void;
  anomaliesCount: number;
  readOnly: boolean;
  onToggleReadOnly: (readOnly: boolean) => void;
  children: React.ReactNode;
}

/** One shell, replacing CoreLayout and IntelligenceLayout, which differed only in
 *  which sidebar they mounted. */
export const AppLayout: React.FC<AppLayoutProps> = ({
  currentView, onChangeView, anomaliesCount, readOnly, onToggleReadOnly, children
}) => (
  <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
    <Sidebar
      currentView={currentView}
      onChangeView={onChangeView}
      anomaliesCount={anomaliesCount}
      readOnly={readOnly}
      onToggleReadOnly={onToggleReadOnly}
    />
    <div className="main-content" style={{
      marginLeft: '250px',
      width: 'calc(100% - 250px)',
      padding: '2rem',
      overflowY: 'auto'
    }}>
      {children}
    </div>
  </div>
);
