import { describe, it, expect } from 'vitest';
import { isGhost, DEFAULT_GHOST_CONFIG } from './ghost';
import type { Student } from './pco';
import { subMonths, format } from 'date-fns';

const mockStudent: Student = {
    id: '1',
    age: 10,
    pcoGrade: 4,
    name: 'Test Student',
    birthdate: '2014-01-01',
    calculatedGrade: 4,
    delta: 0,
    lastCheckInAt: null,
    checkInCount: null,
};

describe('isGhost', () => {
    it('identifies student with no check-in as ghost', () => {
        expect(isGhost(mockStudent)).toBe(true);
    });

    it('identifies student with old check-in as ghost', () => {
        const oldDate = format(subMonths(new Date(), 25), 'yyyy-MM-dd');
        expect(isGhost({ ...mockStudent, lastCheckInAt: oldDate })).toBe(true);
    });

    it('does not identify student with recent check-in as ghost', () => {
        const recentDate = format(subMonths(new Date(), 12), 'yyyy-MM-dd');
        expect(isGhost({ ...mockStudent, lastCheckInAt: recentDate })).toBe(false);
    });

    it('respects custom config', () => {
        const customConfig = { ...DEFAULT_GHOST_CONFIG, checkInThresholdMonths: 10 };
        const borderlineDate = format(subMonths(new Date(), 11), 'yyyy-MM-dd'); // 11 > 10, so ghost
        expect(isGhost({ ...mockStudent, lastCheckInAt: borderlineDate }, customConfig)).toBe(true);
    });
});
