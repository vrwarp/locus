import { describe, it, expect, vi } from 'vitest';
import { calculateNewcomerFunnel } from './retention';
import { PcoCheckIn } from './pco';
import { subMonths, formatISO } from 'date-fns';

describe('calculateNewcomerFunnel', () => {
    // Helper to create check-ins
    const createCheckIn = (id: string, personId: string, date: Date, kind: string = 'Regular'): PcoCheckIn => ({
        id,
        type: 'CheckIn',
        attributes: { created_at: formatISO(date), kind },
        relationships: { person: { data: { type: 'Person', id: personId } }, event: { data: { type: 'Event', id: '1' } } }
    });

    it('identifies newcomers within the last 12 months', () => {
        const now = new Date();
        const sixMonthsAgo = subMonths(now, 6);
        const twoYearsAgo = subMonths(now, 24);

        const checkIns = [
            // Person 1: Newcomer (1 visit)
            createCheckIn('1', 'p1', sixMonthsAgo),
            // Person 2: Existing (Started 2 years ago)
            createCheckIn('2', 'p2', twoYearsAgo),
            createCheckIn('3', 'p2', sixMonthsAgo),
        ];

        const funnel = calculateNewcomerFunnel(checkIns);

        expect(funnel[0].value).toBe(1); // Only p1
        expect(funnel[1].value).toBe(0);
    });

    it('groups check-ins correctly', () => {
        const now = new Date();
        const recent = subMonths(now, 1);

        const checkIns = [
            // Person 1: 1 visit
            createCheckIn('1', 'p1', recent),

            // Person 2: 2 visits
            createCheckIn('2', 'p2', recent),
            createCheckIn('3', 'p2', recent),

            // Person 3: 3 visits
            createCheckIn('4', 'p3', recent),
            createCheckIn('5', 'p3', recent),
            createCheckIn('6', 'p3', recent),

            // Person 4: 4 visits
            createCheckIn('7', 'p4', recent),
            createCheckIn('8', 'p4', recent),
            createCheckIn('9', 'p4', recent),
            createCheckIn('10', 'p4', recent),
        ];

        const funnel = calculateNewcomerFunnel(checkIns);

        // 1st Visit bucket includes everyone (4 people)
        expect(funnel.find(s => s.name === '1st Visit')?.value).toBe(4);
        // 2nd Visit bucket (p2, p3, p4)
        expect(funnel.find(s => s.name === '2nd Visit')?.value).toBe(3);
        // 3rd Visit bucket (p3, p4)
        expect(funnel.find(s => s.name === '3rd Visit')?.value).toBe(2);
        // Member bucket (p4)
        expect(funnel.find(s => s.name === 'Member')?.value).toBe(1);
    });

    it('excludes volunteers', () => {
        const now = new Date();
        const recent = subMonths(now, 1);

        const checkIns = [
            // Person 1: Volunteer check-in only
            createCheckIn('1', 'p1', recent, 'Volunteer'),
            // Person 2: Regular check-in
            createCheckIn('2', 'p2', recent, 'Regular'),
        ];

        const funnel = calculateNewcomerFunnel(checkIns);

        expect(funnel[0].value).toBe(1); // Only p2
    });

    it('counts Guest check-ins, since a first-time visitor is the whole point', () => {
        const recent = new Date();
        recent.setMonth(recent.getMonth() - 1);

        const checkIns = [
            createCheckIn('1', 'p1', recent, 'Guest'),
        ];

        const funnel = calculateNewcomerFunnel(checkIns);

        expect(funnel[0].value).toBe(1);
    });

    it('dates a newcomer from their first visit even if that visit was a Guest check-in', () => {
        // The regression this guards: dropping Guest rows moved the earliest
        // date forward, so somebody who first walked in years ago could be
        // counted as a brand-new visitor.
        const longAgo = new Date();
        longAgo.setFullYear(longAgo.getFullYear() - 3);
        const recent = new Date();
        recent.setMonth(recent.getMonth() - 1);

        const checkIns = [
            createCheckIn('1', 'p1', longAgo, 'Guest'),
            createCheckIn('2', 'p1', recent, 'Regular'),
        ];

        const funnel = calculateNewcomerFunnel(checkIns);

        expect(funnel[0].value).toBe(0); // Not a newcomer - they arrived three years ago
    });
});
