import React from 'react';
import { SidebarIntelligence } from '../components/SidebarIntelligence';

interface IntelligenceLayoutProps {
  currentView: string;
  onChangeView: (view: string) => void;
  totalFixes?: number;
  children: React.ReactNode;
}

export const IntelligenceLayout: React.FC<IntelligenceLayoutProps> = ({
  currentView,
  onChangeView,
  children
}) => {
  return (
    <div style={{ display: 'flex', width: '100%', height: '100vh' }}>
      <SidebarIntelligence
        currentView={currentView}
        onChangeView={onChangeView}
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
