import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { CheckInVelocity } from './CheckInVelocity';
import * as pco from '../utils/pco';
import { formatISO } from 'date-fns';

vi.mock('../utils/pco');
// Mock Recharts to avoid canvas issues
vi.mock('recharts', () => {
    return {
        ResponsiveContainer: ({ children }: any) => <div className="recharts-responsive-container">{children}</div>,
        AreaChart: ({ children }: any) => <svg className="recharts-area-chart">{children}</svg>,
        Area: () => <g className="recharts-area" />,
        XAxis: () => <g className="recharts-x-axis" />,
        YAxis: () => <g className="recharts-y-axis" />,
        Tooltip: () => <div className="recharts-tooltip" />,
        Legend: () => <div className="recharts-legend" />,
    };
});

describe('CheckInVelocity', () => {
    const mockAuth = 'test-auth';

    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock implementation to prevent "undefined" errors
        vi.spyOn(pco, 'fetchRecentCheckIns').mockResolvedValue([]);
    });

    it('renders loading state initially', () => {
        // We delay the resolution to check loading state
        vi.spyOn(pco, 'fetchRecentCheckIns').mockImplementation(() => new Promise(() => {}));
        render(<CheckInVelocity auth={mockAuth} />);
        expect(screen.getByText(/Calculating velocity/i)).toBeInTheDocument();
    });

    it('renders no data message when check-ins are empty', async () => {
        vi.spyOn(pco, 'fetchRecentCheckIns').mockResolvedValue([]);

        render(<CheckInVelocity auth={mockAuth} />);

        await waitFor(() => {
            expect(screen.getByText(/No Data/i)).toBeInTheDocument();
        });
    });

    it('renders chart when data is loaded', async () => {
        const sunday = new Date('2023-10-01T10:00:00');
        const checkIns = [
             { id: '1', type: 'CheckIn', attributes: { created_at: formatISO(sunday), kind: 'Regular' }, relationships: { person: { data: { type: 'Person', id: '1' } }, event: { data: { type: 'Event', id: '1' } } } }
        ];

        // Mock the resolved value with correct type
        vi.spyOn(pco, 'fetchRecentCheckIns').mockResolvedValue(checkIns as any);

        render(<CheckInVelocity auth={mockAuth} />);

        await waitFor(() => {
            expect(screen.getByText(/The "Check-in Velocity"/i)).toBeInTheDocument();
            // Check for mocked chart components presence implicitly by container
            expect(screen.getByText(/Real-time gauge/i)).toBeInTheDocument();
        });
    });

    it('handles error state', async () => {
        vi.spyOn(pco, 'fetchRecentCheckIns').mockRejectedValue(new Error('API Error'));

        render(<CheckInVelocity auth={mockAuth} />);

        await waitFor(() => {
            expect(screen.getByText(/Failed to load check-in data/i)).toBeInTheDocument();
        });
    });
});
