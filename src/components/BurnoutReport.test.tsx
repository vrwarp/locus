import { render, screen, waitFor } from '@testing-library/react';
import { BurnoutReport } from './BurnoutReport';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import * as pcoUtils from '../utils/pco';

vi.mock('../utils/pco', async () => {
    const actual = await vi.importActual('../utils/pco');
    return {
        ...actual,
        fetchEvents: vi.fn().mockResolvedValue([]),
        fetchRecentCheckIns: vi.fn().mockResolvedValue([])
    };
});

describe('BurnoutReport', () => {
    const mockStudents = [{ id: '1', name: 'Linda', avatarUrl: 'http://example.com/linda.jpg' }] as any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        render(<BurnoutReport students={mockStudents} auth="auth-token" />);
        expect(screen.getByText('Analyzing Check-ins...')).toBeInTheDocument();
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

    it('renders empty state when no candidates', async () => {
        vi.mocked(pcoUtils.fetchEvents).mockResolvedValue([]);
        vi.mocked(pcoUtils.fetchRecentCheckIns).mockResolvedValue([]);

        render(<BurnoutReport students={mockStudents} auth="auth-token" />);

        await waitFor(() => {
             expect(screen.getByText('All Clear!')).toBeInTheDocument();
        });
    });
});
