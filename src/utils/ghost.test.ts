import { describe, it, expect } from 'vitest';
import { isGhost, ghostReason, describeGhostReason, DEFAULT_GHOST_CONFIG } from './ghost';
import type { Student } from './pco';
import { subMonths, formatISO } from 'date-fns';

const monthsAgo = (n: number) => formatISO(subMonths(new Date(), n));

const person = (over: Partial<Student> = {}): Student => ({
    id: '1',
    age: 10,
    pcoGrade: 4,
    name: 'Test Student',
    firstName: 'Test',
    lastName: 'Student',
    birthdate: '2014-01-01',
    calculatedGrade: 4,
    delta: 0,
    lastCheckInAt: null,
    checkInCount: null,
    isChild: true,
    createdAt: monthsAgo(48),
    householdId: 'h1',
    hasNameAnomaly: false,
    hasEmailAnomaly: false,
    hasAddressAnomaly: false,
    hasPhoneAnomaly: false,
    firstTimeGiver: false,
    firstGiftDate: null,
    ...over,
} as Student);

describe('ghost detection', () => {
    it('flags a long-standing record that has never checked in', () => {
        const reason = ghostReason(person({ lastCheckInAt: null }));
        expect(reason).toEqual({ kind: 'never-checked-in', tenureMonths: 48 });
    });

    it('flags a record whose last check-in is past the threshold', () => {
        const reason = ghostReason(person({ lastCheckInAt: monthsAgo(30) }));
        expect(reason).toEqual({ kind: 'lapsed', monthsSinceCheckIn: 30 });
    });

    it('leaves a recently seen record alone', () => {
        expect(isGhost(person({ lastCheckInAt: monthsAgo(3) }))).toBe(false);
    });

    it('respects a custom threshold', () => {
        const lapsed = person({ lastCheckInAt: monthsAgo(7) });
        expect(isGhost(lapsed, { ...DEFAULT_GHOST_CONFIG, checkInThresholdMonths: 6 })).toBe(true);
        expect(isGhost(lapsed, { ...DEFAULT_GHOST_CONFIG, checkInThresholdMonths: 12 })).toBe(false);
    });

    describe('protecting new records', () => {
        it('never flags a family who joined last month and has not checked in', () => {
            // The case that mattered most: this used to catch every new family and
            // every baby added at birth, which are the newest rows in the database.
            expect(isGhost(person({ createdAt: monthsAgo(1), lastCheckInAt: null }))).toBe(false);
        });

        it('still protects a new record even past the check-in threshold', () => {
            expect(isGhost(person({ createdAt: monthsAgo(2), lastCheckInAt: monthsAgo(30) }))).toBe(false);
        });

        it('flags it once the record is old enough', () => {
            const config = { ...DEFAULT_GHOST_CONFIG, minTenureMonths: 6 };
            expect(isGhost(person({ createdAt: monthsAgo(5) }), config)).toBe(false);
            expect(isGhost(person({ createdAt: monthsAgo(7) }), config)).toBe(true);
        });

        it('refuses to judge a record with no creation date', () => {
            // PCO returns created_at on every Person, so a missing one means
            // something went wrong upstream — not grounds to deactivate anybody.
            expect(isGhost(person({ createdAt: null, lastCheckInAt: null }))).toBe(false);
        });
    });

    it('describes each reason in terms an admin can check', () => {
        expect(describeGhostReason({ kind: 'never-checked-in', tenureMonths: 30 }))
            .toBe('On file 30 months, never checked in');
        expect(describeGhostReason({ kind: 'lapsed', monthsSinceCheckIn: 26 }))
            .toBe('Last check-in 26 months ago');
    });
});
