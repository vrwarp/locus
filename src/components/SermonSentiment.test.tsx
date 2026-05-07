import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SermonSentiment } from './SermonSentiment';
import * as pcoUtils from '../utils/pco';
import * as sermonUtils from '../utils/sermons';

// Mock Recharts to avoid JS DOM measurement issues
vi.mock('recharts', async () => {
  const OriginalRecharts = await vi.importActual('recharts');
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    BarChart: ({ children, data }: any) => (
        <div data-testid="mock-bar-chart" data-count={data ? data.length : 0}>
            {children}
            {data && data.map((d: any, i: number) => (
              <div key={i} data-testid={`chart-bar-${i}`} data-topic={d.topic} data-attendance={d.attendance}></div>
            ))}
        </div>
    )
  };
});

// Mock PCO Utils
vi.mock('../utils/pco', () => ({
  fetchEvents: vi.fn(),
  fetchRecentCheckIns: vi.fn(),
}));

describe('SermonSentiment', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render loading state initially', async () => {
        // Delay resolution to capture loading state reliably without act warnings later
        let resolveEvents: any;
        (pcoUtils.fetchEvents as any).mockImplementation(() => new Promise(res => resolveEvents = res));
        (pcoUtils.fetchRecentCheckIns as any).mockResolvedValue([]);

        render(<SermonSentiment auth="test" students={[]} />);
        expect(screen.getByText('Analyzing Sermons...')).toBeInTheDocument();

        // Resolve to clean up and prevent warning
        resolveEvents([]);
        await waitFor(() => {
            expect(screen.queryByText('Analyzing Sermons...')).not.toBeInTheDocument();
        });
    });

    it('should render empty state if no data', async () => {
        (pcoUtils.fetchEvents as any).mockResolvedValue([]);
        (pcoUtils.fetchRecentCheckIns as any).mockResolvedValue([]);

        render(<SermonSentiment auth="test" students={[]} />);

        await waitFor(() => {
            expect(screen.getByText('Not enough attendance data to correlate.')).toBeInTheDocument();
        });
    });

    it('should render chart when data is present', async () => {
        (pcoUtils.fetchEvents as any).mockResolvedValue([{ id: '1', attributes: { name: 'Sunday Worship' } }]);
        (pcoUtils.fetchRecentCheckIns as any).mockResolvedValue([{ id: '1', relationships: { event: { data: { id: '1' } } } }]);

        // Mock the utility to return something predictable
        vi.spyOn(sermonUtils, 'correlateSermonsAndAttendance').mockReturnValue([
            { weekStarting: '2023-10-01', topic: 'Grace', attendance: 120 },
            { weekStarting: '2023-10-08', topic: 'Hope', attendance: 150 }
        ]);

        render(<SermonSentiment auth="test" students={[]} />);

        await waitFor(() => {
            expect(screen.getByText('Sermon Sentiment')).toBeInTheDocument();
        });

        expect(screen.getByTestId('mock-bar-chart')).toBeInTheDocument();

        // Check if data was passed down
        expect(screen.getByTestId('chart-bar-0')).toHaveAttribute('data-topic', 'Grace');
        expect(screen.getByTestId('chart-bar-0')).toHaveAttribute('data-attendance', '120');
        expect(screen.getByTestId('chart-bar-1')).toHaveAttribute('data-topic', 'Hope');
        expect(screen.getByTestId('chart-bar-1')).toHaveAttribute('data-attendance', '150');
    });

    it('should handle API errors gracefully', async () => {
        // Suppress console.error in tests
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (pcoUtils.fetchEvents as any).mockRejectedValue(new Error('Network error'));

        render(<SermonSentiment auth="test" students={[]} />);

        await waitFor(() => {
            expect(screen.getByText('Failed to load sermon and attendance data.')).toBeInTheDocument();
        });
        spy.mockRestore();
    });

    it('should refetch data when demographic filter is changed', async () => {
        (pcoUtils.fetchEvents as any).mockResolvedValue([{ id: '1', attributes: { name: 'Sunday Worship' } }]);
        (pcoUtils.fetchRecentCheckIns as any).mockResolvedValue([{ id: '1', relationships: { event: { data: { id: '1' } } } }]);

        const correlateSpy = vi.spyOn(sermonUtils, 'correlateSermonsAndAttendance').mockReturnValue([
            { weekStarting: '2023-10-01', topic: 'Grace', attendance: 120 }
        ]);

        const mockStudents: any[] = [{ id: 'p1', birthdate: '1990-01-01' }];

        render(<SermonSentiment auth="test" students={mockStudents} />);

        await waitFor(() => {
            expect(screen.getByText('Sermon Sentiment')).toBeInTheDocument();
        });

        // Initial call check
        expect(correlateSpy).toHaveBeenCalledWith(expect.anything(), expect.anything(), mockStudents, ['All']);

        const fetchEventsSpy = pcoUtils.fetchEvents;
        const fetchRecentCheckInsSpy = pcoUtils.fetchRecentCheckIns;

        expect(fetchEventsSpy).toHaveBeenCalledTimes(1);
        expect(fetchRecentCheckInsSpy).toHaveBeenCalledTimes(1);

        // Change select
        const select = screen.getByRole('listbox', { name: 'Filter by demographic' });

        // Select multiple options directly to avoid target set traps in JSDOM
        const options = Array.from(select.querySelectorAll('option'));
        options.forEach(opt => {
            opt.selected = opt.value === 'Millennials' || opt.value === 'Gen Z';
        });
        fireEvent.change(select);

        await waitFor(() => {
            // Check that it was called again with the new demographics
            expect(correlateSpy).toHaveBeenCalledWith(expect.anything(), expect.anything(), mockStudents, expect.arrayContaining(['Gen Z', 'Millennials']));
        });

        // Ensure that fetching data is not called again
        expect(fetchEventsSpy).toHaveBeenCalledTimes(1);
        expect(fetchRecentCheckInsSpy).toHaveBeenCalledTimes(1);
    });
});
