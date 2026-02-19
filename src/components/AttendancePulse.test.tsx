import { render, screen, waitFor } from '@testing-library/react';
import { AttendancePulse } from './AttendancePulse';
import { fetchRecentCheckIns } from '../utils/pco';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { PcoCheckIn } from '../utils/pco';

vi.mock('../utils/pco');

// Mock ResizeObserver for Recharts
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe('AttendancePulse', () => {
  const mockAuth = 'test-auth';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (fetchRecentCheckIns as any).mockReturnValue(new Promise(() => {})); // Never resolves
    render(<AttendancePulse auth={mockAuth} />);
    expect(screen.getByText('Loading pulse...')).toBeInTheDocument();
  });

  it('renders chart after data load', async () => {
    const mockCheckIns: PcoCheckIn[] = [
      {
        id: '1',
        type: 'CheckIn',
        attributes: { created_at: '2024-01-01T10:00:00Z', kind: 'Regular' },
        relationships: { person: { data: { type: 'Person', id: '1' } }, event: { data: { type: 'Event', id: '1' } } }
      }
    ];

    (fetchRecentCheckIns as any).mockResolvedValue(mockCheckIns);

    render(<AttendancePulse auth={mockAuth} />);

    await waitFor(() => {
      expect(screen.getByText('The Attendance Pulse')).toBeInTheDocument();
    });
  });

  it('renders error state on failure', async () => {
    (fetchRecentCheckIns as any).mockRejectedValue(new Error('Failed'));

    render(<AttendancePulse auth={mockAuth} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load attendance data.')).toBeInTheDocument();
    });
  });

  it('renders empty state if no data', async () => {
     (fetchRecentCheckIns as any).mockResolvedValue([]);

     render(<AttendancePulse auth={mockAuth} />);

     await waitFor(() => {
        expect(screen.getByText('No check-in data found.')).toBeInTheDocument();
     });
  });
});
