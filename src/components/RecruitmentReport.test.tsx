import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecruitmentReport } from './RecruitmentReport';
import { fetchEvents, fetchRecentCheckIns } from '../utils/pco';
import type { Student, PcoEvent, PcoCheckIn } from '../utils/pco';

// Mock dependencies
vi.mock('../utils/pco', () => ({
    fetchEvents: vi.fn(),
    fetchRecentCheckIns: vi.fn(),
}));

// Mock window.location
Object.defineProperty(window, 'location', {
    writable: true,
    value: { href: '' }
});

describe('RecruitmentReport', () => {
    const mockStudents: Student[] = [
        {
            id: '1', name: 'Sarah Saint', firstName: 'Sarah', lastName: 'Saint',
            isChild: false, householdId: 'h1', email: 'sarah@example.com',
            age: 30, pcoGrade: null, calculatedGrade: 12, delta: 0, birthdate: '1990-01-01',
            lastCheckInAt: null, checkInCount: null, groupCount: null,
            hasNameAnomaly: false, hasEmailAnomaly: false, hasAddressAnomaly: false, hasPhoneAnomaly: false
        }
    ];

    const mockEvents: PcoEvent[] = [
        { id: '100', type: 'Event', attributes: { name: 'Sunday Worship' } }
    ];

    const mockCheckIns: PcoCheckIn[] = Array(5).fill(null).map((_, i) => ({
        id: `c${i}`, type: 'CheckIn',
        attributes: { created_at: new Date().toISOString(), kind: 'Regular' },
        relationships: {
            person: { data: { type: 'Person', id: '1' } },
            event: { data: { type: 'Event', id: '100' } }
        }
    }));

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state initially', () => {
        (fetchEvents as any).mockReturnValue(new Promise(() => {})); // Never resolves
        render(<RecruitmentReport students={mockStudents} auth="auth" />);
        expect(screen.getByText('Analyzing Attendance Patterns...')).toBeInTheDocument();
    });

    it('renders candidates after loading', async () => {
        (fetchEvents as any).mockResolvedValue(mockEvents);
        (fetchRecentCheckIns as any).mockResolvedValue(mockCheckIns);

        render(<RecruitmentReport students={mockStudents} auth="auth" />);

        await waitFor(() => {
            expect(screen.getByText('Sarah Saint')).toBeInTheDocument();
        });
        expect(screen.getByText('Match Score: 50')).toBeInTheDocument(); // 5 * 10
    });

    it('handles email draft click', async () => {
        (fetchEvents as any).mockResolvedValue(mockEvents);
        (fetchRecentCheckIns as any).mockResolvedValue(mockCheckIns);

        render(<RecruitmentReport students={mockStudents} auth="auth" />);

        await waitFor(() => {
            expect(screen.getByText('✉️ Draft Email')).toBeInTheDocument();
        });

        fireEvent.click(screen.getByText('✉️ Draft Email'));
        expect(window.location.href).toContain('mailto:sarah@example.com');
    });

    it('shows empty state if no candidates', async () => {
        (fetchEvents as any).mockResolvedValue(mockEvents);
        (fetchRecentCheckIns as any).mockResolvedValue([]); // No checkins

        render(<RecruitmentReport students={mockStudents} auth="auth" />);

        await waitFor(() => {
            expect(screen.getByText('No Candidates Found')).toBeInTheDocument();
        });
    });
});
