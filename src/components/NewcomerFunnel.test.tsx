import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { NewcomerFunnel } from './NewcomerFunnel';
import * as pcoUtils from '../utils/pco';
import { calculateNewcomerFunnel } from '../utils/retention';

// Mock dependencies
vi.mock('../utils/pco', () => ({
  fetchRecentCheckIns: vi.fn(),
}));

// Mock calculateNewcomerFunnel to return predictable data
vi.mock('../utils/retention', () => ({
  calculateNewcomerFunnel: vi.fn(),
}));

describe('NewcomerFunnel', () => {
  const mockAuth = 'test-auth';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    (pcoUtils.fetchRecentCheckIns as any).mockReturnValue(new Promise(() => {})); // Never resolve
    render(<NewcomerFunnel auth={mockAuth} />);
    expect(screen.getByText('Loading Retention Data...')).toBeInTheDocument();
  });

  it('renders funnel data after loading', async () => {
    const mockCheckIns = [{ id: '1' }];
    const mockFunnelData = [
      { name: '1st Visit', value: 100, fill: '#8884d8' },
      { name: '2nd Visit', value: 60, fill: '#83a6ed' },
      { name: '3rd Visit', value: 30, fill: '#8dd1e1' },
      { name: 'Member', value: 10, fill: '#82ca9d' },
    ];

    (pcoUtils.fetchRecentCheckIns as any).mockResolvedValue(mockCheckIns);
    (calculateNewcomerFunnel as any).mockReturnValue(mockFunnelData);

    render(<NewcomerFunnel auth={mockAuth} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading Retention Data...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('The Newcomer Funnel (Last 12 Months)')).toBeInTheDocument();

    // Check for summary stats
    expect(screen.getByText('Total Newcomers')).toBeInTheDocument();
    expect(screen.getByText('100')).toBeInTheDocument();

    expect(screen.getByText('Retention Rate')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
  });

  it('handles API errors', async () => {
    (pcoUtils.fetchRecentCheckIns as any).mockRejectedValue(new Error('API Fail'));

    render(<NewcomerFunnel auth={mockAuth} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    });
  });
});
