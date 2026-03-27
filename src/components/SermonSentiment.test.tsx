import { render, screen, waitFor } from '@testing-library/react';
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

        render(<SermonSentiment auth="test" />);
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

        render(<SermonSentiment auth="test" />);

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

        render(<SermonSentiment auth="test" />);

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

        render(<SermonSentiment auth="test" />);

        await waitFor(() => {
            expect(screen.getByText('Failed to load sermon and attendance data.')).toBeInTheDocument();
        });
        spy.mockRestore();
    });
});
