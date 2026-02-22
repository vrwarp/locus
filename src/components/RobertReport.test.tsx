import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RobertReport } from './RobertReport';
import type { HealthStats } from '../utils/analytics';
import type { HealthHistoryEntry } from '../utils/storage';
import type { Student } from '../utils/pco';

// Mock Recharts to avoid resizing observer issues in tests
vi.mock('recharts', async () => {
  const OriginalModule = await vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div className="recharts-responsive-container">{children}</div>,
    LineChart: () => <div>LineChart</div>,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
    BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
    Bar: () => <div data-testid="bar" />,
    Legend: () => <div data-testid="legend" />,
    Cell: () => null,
  };
});

// Mock BurnoutReport
vi.mock('./BurnoutReport', () => ({
    BurnoutReport: () => <div data-testid="burnout-report">Mock Burnout Report</div>
}));

// Mock RecruitmentReport
vi.mock('./RecruitmentReport', () => ({
    RecruitmentReport: () => <div data-testid="recruitment-report">Mock Recruitment Report</div>
}));

// Mock AttendancePulse
vi.mock('./AttendancePulse', () => ({
    AttendancePulse: () => <div data-testid="attendance-pulse">Mock Attendance Pulse</div>
}));

// Mock NewcomerFunnel
vi.mock('./NewcomerFunnel', () => ({
    NewcomerFunnel: () => <div data-testid="newcomer-funnel">Mock Newcomer Funnel</div>
}));

// Mock BusFactorGraph
vi.mock('./BusFactorGraph', () => ({
    BusFactorGraph: () => <div data-testid="bus-factor-graph">Mock Bus Factor Graph</div>
}));

describe('RobertReport', () => {
  const mockStats: HealthStats = {
    score: 85,
    total: 1000,
    anomalies: 150,
    accuracy: 85.0
  };

  const mockHistory: HealthHistoryEntry[] = [
    { timestamp: 1600000000000, score: 80, accuracy: 80, totalRecords: 900 },
    { timestamp: 1600086400000, score: 85, accuracy: 85, totalRecords: 1000 },
  ];

  const mockStudents: Student[] = [
      {
          id: '1', age: 10, pcoGrade: 5, name: 'Student 1', firstName: 'Student', lastName: '1', birthdate: '2014-01-01', calculatedGrade: 5, delta: 0, lastCheckInAt: null, checkInCount: 0, groupCount: 0, isChild: true, householdId: 'h1', hasNameAnomaly: false, hasEmailAnomaly: false, hasAddressAnomaly: false, hasPhoneAnomaly: false
      }
  ];

  it('renders nothing when closed', () => {
    const { container } = render(
      <RobertReport isOpen={false} onClose={() => {}} stats={mockStats} history={mockHistory} students={mockStudents} auth="token" />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correct stats when open', () => {
    render(
      <RobertReport isOpen={true} onClose={() => {}} stats={mockStats} history={mockHistory} students={mockStudents} auth="token" />
    );

    expect(screen.getByText('Data Health Audit')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument(); // Score
    // Verify tabs exist
    expect(screen.getByText('Health & Trends')).toBeInTheDocument();
    expect(screen.getByText('Demographics')).toBeInTheDocument();
    expect(screen.getByText('Burnout Risk')).toBeInTheDocument();
    expect(screen.getByText('Pulse')).toBeInTheDocument();
    expect(screen.getByText('Retention')).toBeInTheDocument();
  });

  it('switches to demographics tab and shows chart', () => {
    render(
      <RobertReport isOpen={true} onClose={() => {}} stats={mockStats} history={mockHistory} students={mockStudents} auth="token" />
    );

    const demographicsTab = screen.getByText('Demographics');
    fireEvent.click(demographicsTab);

    expect(screen.getByText('The Generation Stack')).toBeInTheDocument();
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
  });

  it('switches to burnout tab', () => {
    render(
      <RobertReport isOpen={true} onClose={() => {}} stats={mockStats} history={mockHistory} students={mockStudents} auth="token" />
    );

    const burnoutTab = screen.getByText('Burnout Risk');
    fireEvent.click(burnoutTab);

    expect(screen.getByTestId('burnout-report')).toBeInTheDocument();
  });

  it('switches to recruitment tab', () => {
    render(
      <RobertReport isOpen={true} onClose={() => {}} stats={mockStats} history={mockHistory} students={mockStudents} auth="token" />
    );

    const recruitmentTab = screen.getByText('Recruiting');
    fireEvent.click(recruitmentTab);

    expect(screen.getByTestId('recruitment-report')).toBeInTheDocument();
  });

  it('switches to pulse tab', () => {
    render(
      <RobertReport isOpen={true} onClose={() => {}} stats={mockStats} history={mockHistory} students={mockStudents} auth="token" />
    );

    const pulseTab = screen.getByText('Pulse');
    fireEvent.click(pulseTab);

    expect(screen.getByTestId('attendance-pulse')).toBeInTheDocument();
  });

  it('switches to retention tab', () => {
    render(
      <RobertReport isOpen={true} onClose={() => {}} stats={mockStats} history={mockHistory} students={mockStudents} auth="token" />
    );

    const retentionTab = screen.getByText('Retention');
    fireEvent.click(retentionTab);

    expect(screen.getByTestId('newcomer-funnel')).toBeInTheDocument();
  });

  it('switches to bus factor tab', () => {
    render(
      <RobertReport isOpen={true} onClose={() => {}} stats={mockStats} history={mockHistory} students={mockStudents} auth="token" />
    );

    const busFactorTab = screen.getByText('Bus Factor');
    fireEvent.click(busFactorTab);

    expect(screen.getByTestId('bus-factor-graph')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const handleClose = vi.fn();
    render(
      <RobertReport isOpen={true} onClose={handleClose} stats={mockStats} history={mockHistory} students={mockStudents} auth="token" />
    );

    fireEvent.click(screen.getByText('Close Report'));
    expect(handleClose).toHaveBeenCalled();
  });
});
