import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GivingTrends } from './GivingTrends';
import * as pcoUtils from '../utils/pco';

// Mock Recharts to avoid SVG/JSDOM issues
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
  ComposedChart: ({ children }: any) => <div data-testid="composed-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Legend: () => <div data-testid="legend" />
}));

vi.mock('../utils/pco', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/pco')>();
  return {
    ...actual,
    fetchEvents: vi.fn(),
    fetchRecentCheckIns: vi.fn(),
  };
});

describe('GivingTrends', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    vi.mocked(pcoUtils.fetchEvents).mockImplementation(() => new Promise(() => {})); // Never resolves
    vi.mocked(pcoUtils.fetchRecentCheckIns).mockImplementation(() => new Promise(() => {})); // Never resolves

    render(<GivingTrends auth="test-auth" />);
    expect(screen.getByText('Analyzing Giving Trends...')).toBeInTheDocument();
  });

  it('shows error state if fetching fails', async () => {
    vi.mocked(pcoUtils.fetchEvents).mockRejectedValue(new Error('API Error'));
    vi.mocked(pcoUtils.fetchRecentCheckIns).mockResolvedValue([]);

    render(<GivingTrends auth="test-auth" />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load giving and attendance data.')).toBeInTheDocument();
    });
  });

  it('shows empty state if no worship events found', async () => {
    vi.mocked(pcoUtils.fetchEvents).mockResolvedValue([
      { id: '1', type: 'Event', attributes: { name: 'Friday Night Live' } }
    ]);
    vi.mocked(pcoUtils.fetchRecentCheckIns).mockResolvedValue([]);

    render(<GivingTrends auth="test-auth" />);

    await waitFor(() => {
      expect(screen.getByText('Not enough attendance data to correlate with giving.')).toBeInTheDocument();
    });
  });

  it('renders chart successfully when data exists', async () => {
    vi.mocked(pcoUtils.fetchEvents).mockResolvedValue([
      { id: '1', type: 'Event', attributes: { name: 'Sunday Worship Service' } }
    ]);

    // Give some check-ins so we get >0 weeks
    vi.mocked(pcoUtils.fetchRecentCheckIns).mockResolvedValue([
      {
        id: '1',
        attributes: { created_at: '2023-10-01T10:00:00Z', kind: 'Regular' },
        relationships: { event: { data: { type: 'Event', id: '1' } }, person: { data: { type: 'Person', id: 'p1' } } }
      }
    ] as any[]);

    render(<GivingTrends auth="test-auth" />);

    await waitFor(() => {
      expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
    });

    expect(screen.getByText('Stripe Giving Trends')).toBeInTheDocument();
    expect(screen.getByTestId('bar')).toBeInTheDocument();
    expect(screen.getByTestId('line')).toBeInTheDocument();
  });
});
