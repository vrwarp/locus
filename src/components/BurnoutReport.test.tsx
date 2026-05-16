import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BurnoutReport } from './BurnoutReport';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as pcoUtils from '../utils/pco';
import * as exportUtils from '../utils/export';

vi.mock('../utils/pco', async () => {
    const actual = await vi.importActual('../utils/pco');
    return {
        ...actual,
        fetchEvents: vi.fn().mockResolvedValue([]),
        fetchRecentCheckIns: vi.fn().mockResolvedValue([])
    };
});

vi.mock('../utils/export', () => ({
    downloadCSV: vi.fn()
}));

describe('BurnoutReport', () => {
    const mockStudents = [{ id: '1', name: 'Linda', avatarUrl: 'http://example.com/linda.jpg' }] as any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', async () => {
        let resolveEvents: any;
        vi.mocked(pcoUtils.fetchEvents).mockReturnValue(new Promise(resolve => { resolveEvents = resolve; }) as any);

        render(<BurnoutReport students={mockStudents} auth="auth-token" />);
        expect(screen.getByText('Analyzing Check-ins...')).toBeInTheDocument();

        // Resolve to clean up act() warnings
        resolveEvents([]);
        await waitFor(() => {
            expect(screen.queryByText('Analyzing Check-ins...')).not.toBeInTheDocument();
        });
    });

    it('renders candidates when found', async () => {
        const mockEvents = [
            { id: '1', type: 'Event', attributes: { name: 'Worship Service' } },
            { id: '2', type: 'Event', attributes: { name: 'Kids Team' } }
        ];
        // Mock check-ins for the last week so they are "recent"
        const mockCheckIns = Array(8).fill(null).map((_, i) => ({
             id: String(i),
             type: 'CheckIn',
             attributes: { created_at: new Date().toISOString(), kind: 'Regular' },
             relationships: {
                 person: { data: { type: 'Person', id: '1' } },
                 event: { data: { type: 'Event', id: '2' } } // Serving
             }
        }));

        vi.mocked(pcoUtils.fetchEvents).mockResolvedValue(mockEvents as any);
        vi.mocked(pcoUtils.fetchRecentCheckIns).mockResolvedValue(mockCheckIns as any);

        render(<BurnoutReport students={mockStudents} auth="auth-token" />);

        await waitFor(() => {
            expect(screen.getByText('Linda')).toBeInTheDocument();
        });

        expect(screen.getByText('High Risk')).toBeInTheDocument();
        expect(screen.getByText('8')).toBeInTheDocument(); // Serving count
        expect(screen.getByText('0')).toBeInTheDocument(); // Worship count
    });

    it('handles export functionality when candidates exist', async () => {
        const mockEvents = [
            { id: '1', type: 'Event', attributes: { name: 'Worship Service' } },
            { id: '2', type: 'Event', attributes: { name: 'Kids Team' } }
        ];
        const mockCheckIns = Array(8).fill(null).map((_, i) => ({
             id: String(i),
             type: 'CheckIn',
             attributes: { created_at: new Date().toISOString(), kind: 'Regular' },
             relationships: {
                 person: { data: { type: 'Person', id: '1' } },
                 event: { data: { type: 'Event', id: '2' } } // Serving
             }
        }));

        vi.mocked(pcoUtils.fetchEvents).mockResolvedValue(mockEvents as any);
        vi.mocked(pcoUtils.fetchRecentCheckIns).mockResolvedValue(mockCheckIns as any);

        render(<BurnoutReport students={mockStudents} auth="auth-token" />);

        await waitFor(() => {
            expect(screen.getByRole('button', { name: /Export to CSV/i })).toBeInTheDocument();
        });

        fireEvent.click(screen.getByRole('button', { name: /Export to CSV/i }));

        expect(exportUtils.downloadCSV).toHaveBeenCalledTimes(1);
        expect(exportUtils.downloadCSV).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({
                    ID: '1',
                    Name: 'Linda',
                    'Risk Level': 'High',
                    'Serving Count': 8,
                    'Worship Count': 0
                })
            ]),
            'burnout_report.csv'
        );
    });

    it('renders empty state when no candidates', async () => {
        vi.mocked(pcoUtils.fetchEvents).mockResolvedValue([]);
        vi.mocked(pcoUtils.fetchRecentCheckIns).mockResolvedValue([]);

        render(<BurnoutReport students={mockStudents} auth="auth-token" />);

        await waitFor(() => {
             expect(screen.getByText('All Clear!')).toBeInTheDocument();
        });
    });

    it('renders error state if API fails', async () => {
        vi.mocked(pcoUtils.fetchEvents).mockRejectedValue(new Error('Network Error'));

        render(<BurnoutReport students={mockStudents} auth="auth-token" />);

        await waitFor(() => {
            expect(screen.getByText('Failed to load check-in data.')).toBeInTheDocument();
        });
    });
});
