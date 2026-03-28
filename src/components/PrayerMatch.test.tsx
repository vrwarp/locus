import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PrayerMatch } from './PrayerMatch';
import * as prayerUtils from '../utils/prayer';
import type { Student } from '../utils/pco';

// Mock matchPrayerPartners
vi.mock('../utils/prayer', () => ({
    matchPrayerPartners: vi.fn()
}));

describe('PrayerMatch', () => {
    const mockStudents: Student[] = [];

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders empty state when no matches are found', () => {
        vi.mocked(prayerUtils.matchPrayerPartners).mockReturnValue([]);
        render(<PrayerMatch students={mockStudents} />);

        expect(screen.getByText('No Prayer Partners Found')).toBeInTheDocument();
        expect(screen.getByText("Ensure that people have a 'prayer_topic' assigned to be matched.")).toBeInTheDocument();
    });

    it('renders matched pairs and groups them by topic', () => {
        const mockMatches: prayerUtils.PrayerMatch[] = [
            {
                topic: 'Health',
                personA: { id: '1', name: 'Alice Smith' } as Student,
                personB: { id: '2', name: 'Bob Johnson' } as Student
            },
            {
                topic: 'Health',
                personA: { id: '3', name: 'Charlie Brown' } as Student // odd person out
            },
            {
                topic: 'Financial',
                personA: { id: '4', name: 'Dave Davis' } as Student,
                personB: { id: '5', name: 'Eve Evans' } as Student
            }
        ];

        vi.mocked(prayerUtils.matchPrayerPartners).mockReturnValue(mockMatches);
        render(<PrayerMatch students={mockStudents} />);

        // Verify headers
        expect(screen.getByText('Prayer Partner Match')).toBeInTheDocument();
        expect(screen.getByText('Struggle: Health')).toBeInTheDocument();
        expect(screen.getByText('Struggle: Financial')).toBeInTheDocument();

        // Initially anonymous
        expect(screen.getAllByText('👤')).toHaveLength(5); // 5 people
        expect(screen.getByText('Person 1')).toBeInTheDocument();
        expect(screen.getByText('Person 2')).toBeInTheDocument();
        expect(screen.getByText('Person 3')).toBeInTheDocument();
        expect(screen.getByText('Unmatched')).toBeInTheDocument();
        expect(screen.getByText('Person 4')).toBeInTheDocument();
        expect(screen.getByText('Person 5')).toBeInTheDocument();

        // Reveal identities for the first match
        const revealBtns = screen.getAllByText('Reveal Identities');
        fireEvent.click(revealBtns[0]);

        // First match is revealed
        expect(screen.getByText('Hide Identities')).toBeInTheDocument();
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Johnson')).toBeInTheDocument();

        // Other matches are still anonymous
        expect(screen.queryByText('Charlie Brown')).not.toBeInTheDocument();
        expect(screen.queryByText('Dave Davis')).not.toBeInTheDocument();
        expect(screen.queryByText('Eve Evans')).not.toBeInTheDocument();
    });
});
