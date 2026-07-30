import { describe, it, expect } from 'vitest';
import { calculateDrift } from './drift';
import type { Student, PcoCheckIn } from './pco';
import { subDays, subMonths } from 'date-fns';

describe('calculateDrift', () => {
    const mockStudent = (id: string, name: string): Student => ({
        id,
        name,
        firstName: name.split(' ')[0],
        lastName: name.split(' ')[1] || '',
        age: 30,
        pcoGrade: null,
        birthdate: '1990-01-01',
        calculatedGrade: -1,
        delta: 0,
        lastCheckInAt: null,
        checkInCount: null,
        isChild: false,
        createdAt: '2020-01-01',
        householdId: null,
        hasNameAnomaly: false
    });

    const mockCheckIn = (id: string, personId: string, daysAgo: number): PcoCheckIn => {
        const date = subDays(new Date(), daysAgo);
        return {
            id,
            type: 'CheckIn',
            attributes: {
                created_at: date.toISOString(),
                kind: 'Regular'
            },
            relationships: {
                person: { data: { type: 'Person', id: personId } },
                event: { data: { type: 'Event', id: 'e1' } }
            }
        };
    };

    it('identifies a drifting user (drop > 50% from high baseline)', () => {
        const s1 = mockStudent('1', 'Drifter Dan');
        const checkIns: PcoCheckIn[] = [
            // Past 90-180 days: 4 checkins
            mockCheckIn('c1', '1', 100),
            mockCheckIn('c2', '1', 110),
            mockCheckIn('c3', '1', 120),
            mockCheckIn('c4', '1', 130),
            // Recent 0-90 days: 1 checkin (75% drop)
            mockCheckIn('c5', '1', 30),
        ];

        const drift = calculateDrift(checkIns, [s1]);
        expect(drift).toHaveLength(1);
        expect(drift[0].person.name).toBe('Drifter Dan');
        expect(drift[0].pastCheckIns).toBe(4);
        expect(drift[0].recentCheckIns).toBe(1);
        expect(drift[0].dropPercentage).toBe(75);
    });

    it('ignores users who never met the baseline threshold', () => {
        const s1 = mockStudent('1', 'Sparse Sally');
        const checkIns: PcoCheckIn[] = [
            // Past: 2 checkins (below the 4 threshold)
            mockCheckIn('c1', '1', 100),
            mockCheckIn('c2', '1', 110),
            // Recent: 0 checkins
        ];

        const drift = calculateDrift(checkIns, [s1]);
        expect(drift).toHaveLength(0); // Did not meet the threshold of 4 past check-ins
    });

    it('ignores users with consistent check-ins', () => {
        const s1 = mockStudent('1', 'Steady Steve');
        const checkIns: PcoCheckIn[] = [
            // Past: 4 checkins
            mockCheckIn('c1', '1', 100),
            mockCheckIn('c2', '1', 110),
            mockCheckIn('c3', '1', 120),
            mockCheckIn('c4', '1', 130),
            // Recent: 3 checkins (Drop is < 50%)
            mockCheckIn('c5', '1', 10),
            mockCheckIn('c6', '1', 20),
            mockCheckIn('c7', '1', 30),
        ];

        const drift = calculateDrift(checkIns, [s1]);
        expect(drift).toHaveLength(0);
    });

    it('sorts the results by drop percentage, then by baseline volume', () => {
        const s1 = mockStudent('1', 'Drop 100');
        const s2 = mockStudent('2', 'Drop 75, High Volume');
        const s3 = mockStudent('3', 'Drop 75, Low Volume');

        const checkIns: PcoCheckIn[] = [
            // s1: 4 past, 0 recent -> 100%
            mockCheckIn('c1', '1', 100), mockCheckIn('c2', '1', 110), mockCheckIn('c3', '1', 120), mockCheckIn('c4', '1', 130),

            // s2: 8 past, 2 recent -> 75% drop
            mockCheckIn('c5', '2', 100), mockCheckIn('c6', '2', 110), mockCheckIn('c7', '2', 120), mockCheckIn('c8', '2', 130),
            mockCheckIn('c9', '2', 140), mockCheckIn('c10', '2', 150), mockCheckIn('c11', '2', 160), mockCheckIn('c12', '2', 170),
            mockCheckIn('c13', '2', 30), mockCheckIn('c14', '2', 40),

            // s3: 4 past, 1 recent -> 75% drop
            mockCheckIn('c15', '3', 100), mockCheckIn('c16', '3', 110), mockCheckIn('c17', '3', 120), mockCheckIn('c18', '3', 130),
            mockCheckIn('c19', '3', 30),
        ];

        const drift = calculateDrift(checkIns, [s1, s2, s3]);
        expect(drift).toHaveLength(3);

        // 1st: 100% drop
        expect(drift[0].person.name).toBe('Drop 100');
        // 2nd: 75% drop, 8 past
        expect(drift[1].person.name).toBe('Drop 75, High Volume');
        // 3rd: 75% drop, 4 past
        expect(drift[2].person.name).toBe('Drop 75, Low Volume');
    });

    it('returns empty array when there are no check-ins or students', () => {
        expect(calculateDrift([], [])).toEqual([]);
        expect(calculateDrift([], [mockStudent('1', 'A')])).toEqual([]);
    });
});
