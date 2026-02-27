import { describe, it, expect } from 'vitest';
import { calculateDriftRisk } from './drift';
import type { Student, PcoCheckIn } from './pco';
import { subWeeks, subMonths, formatISO } from 'date-fns';

const createCheckIn = (personId: string, date: Date): PcoCheckIn => ({
    id: '1',
    type: 'CheckIn',
    attributes: {
        created_at: formatISO(date),
        kind: 'Regular'
    },
    relationships: {
        person: { data: { type: 'Person', id: personId } },
        event: { data: { type: 'Event', id: '1' } }
    }
});

const createStudent = (id: string): Student => ({
    id,
    name: 'Test Student',
    firstName: 'Test',
    lastName: 'Student',
    age: 30,
    isChild: false,
    householdId: null,
    pcoGrade: null,
    birthdate: '1990-01-01',
    calculatedGrade: 0,
    delta: 0,
    lastCheckInAt: null,
    checkInCount: 0,
    groupCount: 0,
    hasNameAnomaly: false,
    hasEmailAnomaly: false,
    hasAddressAnomaly: false,
    hasPhoneAnomaly: false,
});

describe('calculateDriftRisk', () => {
    const now = new Date();

    it('ignores newcomers (tenure < 6 months)', () => {
        const student = createStudent('1');
        const checkIns = [
            createCheckIn('1', subWeeks(now, 1)), // Just started
            createCheckIn('1', subWeeks(now, 2)),
        ];

        const results = calculateDriftRisk(checkIns, [student]);
        expect(results).toHaveLength(0);
    });

    it('ignores low baseline attendance (< 0.5/week)', () => {
        const student = createStudent('1');
        // Attended once 4 months ago
        const checkIns = [
            createCheckIn('1', subMonths(now, 4)),
            createCheckIn('1', subMonths(now, 8)), // Start date for tenure
        ];

        const results = calculateDriftRisk(checkIns, [student]);
        expect(results).toHaveLength(0);
    });

    it('detects "Gone" status (100% drop)', () => {
        const student = createStudent('1');
        const checkIns: PcoCheckIn[] = [];

        // Baseline: Weekly for months 2-7
        for (let i = 0; i < 20; i++) {
             checkIns.push(createCheckIn('1', subWeeks(subMonths(now, 2), i)));
        }
        // Recent: Zero check-ins in last 6 weeks

        // Add one old check-in to establish tenure > 6m
        checkIns.push(createCheckIn('1', subMonths(now, 8)));

        const results = calculateDriftRisk(checkIns, [student]);
        expect(results).toHaveLength(1);
        expect(results[0].status).toBe('Gone');
        expect(results[0].dropPercentage).toBe(100);
    });

    it('detects "Drifting" status (50% drop)', () => {
        const student = createStudent('1');
        const checkIns: PcoCheckIn[] = [];

        // Baseline: Every week (Rate ~1.0)
        for (let i = 0; i < 20; i++) {
             checkIns.push(createCheckIn('1', subWeeks(subMonths(now, 2), i)));
        }

        // Recent: Twice in 6 weeks (Rate ~0.33)
        // Baseline 0.95 vs Recent 0.33 -> ~65% drop
        for (let i = 0; i < 2; i++) {
            checkIns.push(createCheckIn('1', subWeeks(now, i * 3)));
        }

        // Tenure check
        checkIns.push(createCheckIn('1', subMonths(now, 8)));

        const results = calculateDriftRisk(checkIns, [student]);
        expect(results).toHaveLength(1);
        expect(results[0].status).toBe('Drifting');
    });

     it('detects "At Risk" status (25% drop)', () => {
        const student = createStudent('1');
        const checkIns: PcoCheckIn[] = [];

        // Baseline: Every week (Rate ~1.0)
        for (let i = 0; i < 20; i++) {
             checkIns.push(createCheckIn('1', subWeeks(subMonths(now, 2), i)));
        }

        // Recent: 4 times in 6 weeks (Rate ~0.66) -> Drop ~33%
        for (let i = 0; i < 4; i++) {
            checkIns.push(createCheckIn('1', subWeeks(now, i)));
        }

        // Tenure check
        checkIns.push(createCheckIn('1', subMonths(now, 8)));

        const results = calculateDriftRisk(checkIns, [student]);
        expect(results).toHaveLength(1);
        expect(results[0].status).toBe('At Risk');
    });
});
