import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SermonCorrelator } from './SermonCorrelator';
import { fetchEvents, fetchRecentCheckIns } from '../utils/pco';
import { correlateSermonsWithEngagement } from '../utils/sermons';

vi.mock('../utils/pco');
vi.mock('../utils/sermons');
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: any }) => <div>{children}</div>,
  ComposedChart: ({ children }: { children: any }) => <div data-testid="composed-chart">{children}</div>,
  Bar: () => <div data-testid="bar" />,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="xaxis" />,
  YAxis: () => <div data-testid="yaxis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Legend: () => <div data-testid="legend" />
}));

describe('SermonCorrelator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading state initially', () => {
    vi.mocked(fetchEvents).mockImplementation(() => new Promise(() => {}));
    vi.mocked(fetchRecentCheckIns).mockImplementation(() => new Promise(() => {}));

    render(<SermonCorrelator auth="test" students={[]} />);
    expect(screen.getByText('Analyzing Sermon Impact...')).toBeInTheDocument();
  });

  it('shows error state if fetch fails', async () => {
    vi.mocked(fetchEvents).mockRejectedValue(new Error('Failed'));

    render(<SermonCorrelator auth="test" students={[]} />);
    await waitFor(() => {
      expect(screen.getByText('Failed to load sermon engagement data.')).toBeInTheDocument();
    });
  });

  it('shows empty state when no data returned', async () => {
    vi.mocked(fetchEvents).mockResolvedValue([]);
    vi.mocked(fetchRecentCheckIns).mockResolvedValue([]);
    vi.mocked(correlateSermonsWithEngagement).mockReturnValue([]);

    render(<SermonCorrelator auth="test" students={[]} />);
    await waitFor(() => {
      expect(screen.getByText('Not enough historical attendance data to perform correlation.')).toBeInTheDocument();
    });
  });

  it('renders the chart with correlated data', async () => {
    vi.mocked(fetchEvents).mockResolvedValue([{ id: '1', attributes: { name: 'Sunday Worship' } }] as any);
    vi.mocked(fetchRecentCheckIns).mockResolvedValue([{ id: '1', relationships: { event: { data: { id: '1' } } } }] as any);
    vi.mocked(correlateSermonsWithEngagement).mockReturnValue([
      { weekStarting: '2023-10-01', topic: 'Community Matters', smallGroupSignups: 10, volunteerApplications: 2 }
    ]);

    render(<SermonCorrelator auth="test" students={[]} />);
    await waitFor(() => {
      expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
    });

    expect(screen.getByText('AI Insights')).toBeInTheDocument();
  });

  it('refetches data when demographic filter is changed', async () => {
    vi.mocked(fetchEvents).mockResolvedValue([{ id: '1', attributes: { name: 'Sunday Worship' } }] as any);
    vi.mocked(fetchRecentCheckIns).mockResolvedValue([{ id: '1', relationships: { event: { data: { id: '1' } } } }] as any);

    const correlateSpy = vi.mocked(correlateSermonsWithEngagement).mockReturnValue([
      { weekStarting: '2023-10-01', topic: 'Community Matters', smallGroupSignups: 10, volunteerApplications: 2 }
    ]);

    const mockStudents: any[] = [{ id: 'p1', birthdate: '1990-01-01' }];

    render(<SermonCorrelator auth="test" students={mockStudents} />);

    await waitFor(() => {
      expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
    });

    expect(correlateSpy).toHaveBeenCalledWith(expect.anything(), expect.anything(), mockStudents, ['All']);

    const fetchEventsSpy = vi.mocked(fetchEvents);
    const fetchRecentCheckInsSpy = vi.mocked(fetchRecentCheckIns);

    expect(fetchEventsSpy).toHaveBeenCalledTimes(1);
    expect(fetchRecentCheckInsSpy).toHaveBeenCalledTimes(1);

    const select = screen.getByRole('listbox', { name: 'Filter by demographic' });

    const options = Array.from(select.querySelectorAll('option'));
    options.forEach(opt => {
        opt.selected = opt.value === 'Millennials' || opt.value === 'Gen Z';
    });
    fireEvent.change(select);

    await waitFor(() => {
        expect(correlateSpy).toHaveBeenCalledWith(expect.anything(), expect.anything(), mockStudents, expect.arrayContaining(['Gen Z', 'Millennials']));
    });

    expect(fetchEventsSpy).toHaveBeenCalledTimes(1);
    expect(fetchRecentCheckInsSpy).toHaveBeenCalledTimes(1);
  });
});
