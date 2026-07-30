import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DriftReport } from './DriftReport';
import { fetchRecentCheckIns } from '../utils/pco';
import { calculateDrift } from '../utils/drift';
import { downloadCSV } from '../utils/export';

// Mock dependencies
vi.mock('../utils/pco', () => ({
  fetchRecentCheckIns: vi.fn(),
}));

vi.mock('../utils/drift', () => ({
  calculateDrift: vi.fn(),
}));

vi.mock('../utils/export', () => ({
  downloadCSV: vi.fn(),
}));

describe('DriftReport', () => {
  const mockStudents = [{ id: '1', name: 'John Doe', avatarUrl: '' } as any];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('shows loading state initially', async () => {
    vi.mocked(fetchRecentCheckIns).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 100))
    );

    render(<DriftReport students={mockStudents} auth="test-token" />);
    expect(screen.getByText('Analyzing Engagement Patterns...')).toBeInTheDocument();
  });

  it('renders empty state when there are no drifting members', async () => {
    vi.mocked(fetchRecentCheckIns).mockResolvedValue([]);
    vi.mocked(calculateDrift).mockReturnValue([]);

    await act(async () => {
        render(<DriftReport students={mockStudents} auth="test-token" />);
    });

    await waitFor(() => {
      expect(screen.getByText('Steady as She Goes')).toBeInTheDocument();
      expect(screen.getByText('No significant engagement drift detected among core members.')).toBeInTheDocument();
    });
  });

  it('renders drifting members correctly', async () => {
    vi.mocked(fetchRecentCheckIns).mockResolvedValue([]);
    vi.mocked(calculateDrift).mockReturnValue([
      {
        person: { id: '1', name: 'Drifter Dan', avatarUrl: '' } as any,
        recentCheckIns: 1,
        pastCheckIns: 10,
        dropPercentage: 90,
      }
    ]);

    await act(async () => {
        render(<DriftReport students={mockStudents} auth="test-token" />);
    });

    await waitFor(() => {
      expect(screen.getByText('Drifter Dan')).toBeInTheDocument();
      expect(screen.getByText('90%')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // Recent
      expect(screen.getByText('10')).toBeInTheDocument(); // Past
    });
  });

  it('calls downloadCSV with correct data when export is clicked', async () => {
    vi.mocked(fetchRecentCheckIns).mockResolvedValue([]);
    vi.mocked(calculateDrift).mockReturnValue([
      {
        person: { id: '1', name: 'Drifter Dan', avatarUrl: '' } as any,
        recentCheckIns: 1,
        pastCheckIns: 10,
        dropPercentage: 90,
      }
    ]);

    await act(async () => {
        render(<DriftReport students={mockStudents} auth="test-token" />);
    });

    await waitFor(() => {
      expect(screen.getByText('Export to CSV')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByText(/Export to CSV/i));

    expect(downloadCSV).toHaveBeenCalledTimes(1);
    expect(downloadCSV).toHaveBeenCalledWith(
      [
        {
          'Person ID': '1',
          'Name': 'Drifter Dan',
          'Drop Percentage': '90%',
          'Recent Check-Ins (Last 90 Days)': 1,
          'Past Check-Ins (91-180 Days Ago)': 10
        }
      ],
      'drift_report.csv'
    );
  });
});
