import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { BusFactorGraph } from './BusFactorGraph';
import * as pco from '../utils/pco';

// Mock dependencies
vi.mock('../utils/pco', async () => {
    const actual = await vi.importActual('../utils/pco');
    return {
        ...actual,
        fetchEvents: vi.fn(),
        fetchRecentCheckIns: vi.fn(),
    };
});

// Mock Recharts to avoid issues with ResponsiveContainer in JSDOM
vi.mock('recharts', async () => {
    const OriginalModule = await vi.importActual('recharts');
    return {
        ...OriginalModule,
        ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
            <div style={{ width: 800, height: 800 }}>{children}</div>
        ),
    };
});

describe('BusFactorGraph', () => {
    const mockAuth = 'test-auth';
    const mockStudents = [
        { id: '1', name: 'Alice', avatarUrl: 'http://alice.png' },
        { id: '2', name: 'Bob' },
    ] as pco.Student[];

    const mockEvents = [
        { id: 'e1', type: 'Event', attributes: { name: 'Kids Team' } }, // Serving
        { id: 'e2', type: 'Event', attributes: { name: 'Worship Service' } }
    ] as pco.PcoEvent[];

    const mockCheckIns = [
        // Alice solo
        { id: 'c1', type: 'CheckIn', attributes: { created_at: '2023-01-01T09:00:00Z', kind: 'Volunteer' }, relationships: { event: { data: { id: 'e1' } }, person: { data: { id: '1' } } } },
        { id: 'c2', type: 'CheckIn', attributes: { created_at: '2023-01-08T09:00:00Z', kind: 'Volunteer' }, relationships: { event: { data: { id: 'e1' } }, person: { data: { id: '1' } } } },
        // Bob serves alone once
        { id: 'c3', type: 'CheckIn', attributes: { created_at: '2023-01-15T09:00:00Z', kind: 'Volunteer' }, relationships: { event: { data: { id: 'e1' } }, person: { data: { id: '2' } } } },
    ] as pco.PcoCheckIn[];

    beforeEach(() => {
        vi.resetAllMocks();
    });

    it('renders loading state initially', () => {
        (pco.fetchEvents as any).mockReturnValue(new Promise(() => {})); // Pending promise
        render(<BusFactorGraph auth={mockAuth} students={mockStudents} />);
        expect(screen.getByText(/Analyzing critical volunteers/i)).toBeInTheDocument();
    });

    it('renders data correctly', async () => {
        (pco.fetchEvents as any).mockResolvedValue(mockEvents);
        (pco.fetchRecentCheckIns as any).mockResolvedValue(mockCheckIns);

        render(<BusFactorGraph auth={mockAuth} students={mockStudents} />);

        await waitFor(() => {
            expect(screen.queryByText(/Analyzing critical volunteers/i)).not.toBeInTheDocument();
        });

        // Check for header
        expect(screen.getByText(/The "Bus Factor" Risk/i)).toBeInTheDocument();

        // Check for table content
        // Alice should have 2 solo shifts
        const aliceRow = screen.getByText('Alice').closest('tr');
        expect(aliceRow).toBeInTheDocument();
        expect(aliceRow).toHaveTextContent('2'); // Solo count

        const bobRow = screen.getByText('Bob').closest('tr');
        expect(bobRow).toBeInTheDocument();
        expect(bobRow).toHaveTextContent('1');
    });

    it('renders empty state if no risks found', async () => {
        (pco.fetchEvents as any).mockResolvedValue(mockEvents);
        (pco.fetchRecentCheckIns as any).mockResolvedValue([]); // No check-ins

        render(<BusFactorGraph auth={mockAuth} students={mockStudents} />);

        await waitFor(() => {
            expect(screen.getByText(/All Clear!/i)).toBeInTheDocument();
        });
    });
});
