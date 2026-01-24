import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RobertReport } from './RobertReport';
import type { HealthStats } from '../utils/analytics';
import type { HealthHistoryEntry } from '../utils/storage';

// Mock Recharts to avoid resizing observer issues in tests
vi.mock('recharts', () => {
  const OriginalModule = vi.importActual('recharts');
  return {
    ...OriginalModule,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div className="recharts-responsive-container">{children}</div>,
    LineChart: () => <div>LineChart</div>,
    Line: () => null,
    XAxis: () => null,
    YAxis: () => null,
    Tooltip: () => null,
  };
});

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

  it('renders nothing when closed', () => {
    const { container } = render(
      <RobertReport isOpen={false} onClose={() => {}} stats={mockStats} history={mockHistory} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders correct stats when open', () => {
    render(
      <RobertReport isOpen={true} onClose={() => {}} stats={mockStats} history={mockHistory} />
    );

    expect(screen.getByText('Data Health Audit')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument(); // Score
    expect(screen.getByText('1000')).toBeInTheDocument(); // Total
    expect(screen.getByText('150')).toBeInTheDocument(); // Anomalies
    expect(screen.getByText('85.0%')).toBeInTheDocument(); // Accuracy
  });

  it('calls onClose when close button clicked', () => {
    const handleClose = vi.fn();
    render(
      <RobertReport isOpen={true} onClose={handleClose} stats={mockStats} history={mockHistory} />
    );

    fireEvent.click(screen.getByText('Close Report'));
    expect(handleClose).toHaveBeenCalled();
  });
});
