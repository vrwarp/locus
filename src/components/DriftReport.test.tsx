import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DriftReport } from './DriftReport';
import * as pco from '../utils/pco';
import { downloadCSV } from '../utils/export';
import { subDays, formatISO } from 'date-fns';
import type { Student, PcoCheckIn } from '../utils/pco';

vi.mock('../utils/export', () => ({
  downloadCSV: vi.fn(),
}));

const mockStudents: Student[] = [
  {
    id: '1',
    name: 'Drifting Person',
    firstName: 'Drifting',
    lastName: 'Person',
    age: 30,
    pcoGrade: null,
    birthdate: '1993-01-01',
    calculatedGrade: -1,
    delta: 0,
    lastCheckInAt: null,
    checkInCount: null,
    isChild: false,
    createdAt: '2020-01-01T00:00:00Z',
    householdId: null,
    hasNameAnomaly: false
  }
];

const mockCheckIns: PcoCheckIn[] = [
    {
      id: 'ci-1',
      type: 'CheckIn',
      attributes: { created_at: formatISO(subDays(new Date(), 10)), kind: 'Regular' },
      relationships: { person: { data: { type: 'Person', id: '1' } }, event: { data: { type: 'Event', id: 'evt-1' } } }
    },
    {
      id: 'ci-2',
      type: 'CheckIn',
      attributes: { created_at: formatISO(subDays(new Date(), 100)), kind: 'Regular' },
      relationships: { person: { data: { type: 'Person', id: '1' } }, event: { data: { type: 'Event', id: 'evt-1' } } }
    },
    {
      id: 'ci-3',
      type: 'CheckIn',
      attributes: { created_at: formatISO(subDays(new Date(), 120)), kind: 'Regular' },
      relationships: { person: { data: { type: 'Person', id: '1' } }, event: { data: { type: 'Event', id: 'evt-1' } } }
    }
];


describe('DriftReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.spyOn(pco, 'fetchRecentCheckIns').mockReturnValue(new Promise(() => {})); // pending promise

    render(<DriftReport students={mockStudents} auth="mock-auth" />);

    expect(screen.getByText('Calculating Drift...')).toBeInTheDocument();
  });

  it('displays drift data when calculated', async () => {
    vi.spyOn(pco, 'fetchRecentCheckIns').mockResolvedValue(mockCheckIns);

    render(<DriftReport students={mockStudents} auth="mock-auth" />);

    await waitFor(() => {
      expect(screen.getByText('Drifting Person')).toBeInTheDocument();
    });

    // 2 previous, 1 recent = 50% drop
    expect(screen.getByText('2')).toBeInTheDocument(); // Previous
    expect(screen.getByText('1')).toBeInTheDocument(); // Recent
    expect(screen.getByText('50%')).toBeInTheDocument(); // Dropoff
  });

  it('handles empty states correctly', async () => {
    vi.spyOn(pco, 'fetchRecentCheckIns').mockResolvedValue([]);

    render(<DriftReport students={mockStudents} auth="mock-auth" />);

    await waitFor(() => {
      expect(screen.getByText('No Drift Detected')).toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
      vi.spyOn(pco, 'fetchRecentCheckIns').mockRejectedValue(new Error('Network error'));

      render(<DriftReport students={mockStudents} auth="mock-auth" />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load check-in data.')).toBeInTheDocument();
      });
  });

  it('calls downloadCSV with correct data', async () => {
    vi.spyOn(pco, 'fetchRecentCheckIns').mockResolvedValue(mockCheckIns);

    render(<DriftReport students={mockStudents} auth="mock-auth" />);

    await waitFor(() => {
      expect(screen.getByText('Drifting Person')).toBeInTheDocument();
    });

    const exportBtn = screen.getByText(/Export to CSV/i);
    fireEvent.click(exportBtn);

    expect(downloadCSV).toHaveBeenCalledTimes(1);
    const calledData = (downloadCSV as any).mock.calls[0][0];

    expect(calledData[0]).toEqual({
        'Person ID': '1',
        'Name': 'Drifting Person',
        'Previous 90 Days Check-ins': 2,
        'Recent 90 Days Check-ins': 1,
        'Drop Percentage': '50%',
    });
    expect((downloadCSV as any).mock.calls[0][1]).toBe('drift_report.csv');
  });
});
