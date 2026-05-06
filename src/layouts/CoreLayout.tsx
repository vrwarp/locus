import React from 'react';
import { SidebarCore } from '../components/SidebarCore';

interface CoreLayoutProps {
  currentView: string;
  onChangeView: (view: string) => void;
  anomaliesCount: number;
  totalFixes: number;
  children: React.ReactNode;
}

export const CoreLayout: React.FC<CoreLayoutProps> = ({
  currentView,
  onChangeView,
  anomaliesCount,
  totalFixes,
  children
}) => {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
      <SidebarCore
        currentView={currentView}
        onChangeView={onChangeView}
        anomaliesCount={anomaliesCount}
        totalFixes={totalFixes}
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
};
