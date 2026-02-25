import { describe, it, expect } from 'vitest';
import { calculateBirthdayHeatmap } from './heatmap';
import type { Student } from './pco';

const mockStudent = (birthdate: string): Student => ({
    id: '1',
    age: 10,
    pcoGrade: 5,
    name: 'Test Student',
    firstName: 'Test',
    lastName: 'Student',
    birthdate: birthdate,
    calculatedGrade: 5,
    delta: 0,
    lastCheckInAt: null,
    checkInCount: 0,
    groupCount: 0,
    isChild: true,
    householdId: '1',
    hasNameAnomaly: false,
    hasEmailAnomaly: false,
    hasAddressAnomaly: false,
    hasPhoneAnomaly: false
});

describe('calculateBirthdayHeatmap', () => {
    it('returns initialized heatmap with 0 counts for empty input', () => {
        const result = calculateBirthdayHeatmap([]);
        // 2024 is a leap year, so 366 days
        expect(result.length).toBe(366);
        expect(result.every(c => c.count === 0)).toBe(true);
    });

    it('correctly counts birthdays', () => {
        const students = [
            mockStudent('2010-01-01'),
            mockStudent('2015-01-01'),
            mockStudent('2012-12-31')
        ];
        const result = calculateBirthdayHeatmap(students);

        const jan1 = result.find(c => c.monthIndex === 0 && c.day === 1);
        expect(jan1?.count).toBe(2);
        expect(jan1?.students.length).toBe(2);

        const dec31 = result.find(c => c.monthIndex === 11 && c.day === 31);
        expect(dec31?.count).toBe(1);
    });

    it('handles leap year birthdays (Feb 29)', () => {
        const students = [
            mockStudent('2000-02-29'), // Leap year
            mockStudent('2016-02-29')  // Leap year
        ];
        const result = calculateBirthdayHeatmap(students);

        const feb29 = result.find(c => c.monthIndex === 1 && c.day === 29);
        expect(feb29).toBeDefined();
        expect(feb29?.count).toBe(2);
    });

    it('ignores invalid dates', () => {
        const students = [
            mockStudent('invalid-date'),
            // 2023 is not a leap year, so Feb 29 is invalid in that context?
            // Actually date-fns parseISO might handle 2023-02-30 as March 2 or invalid.
            // But our logic iterates through the heatmap cells (which are based on 2024) and matches month/day.
            // If parseISO returns Invalid Date, it's skipped.
        ];
        const result = calculateBirthdayHeatmap(students);
        expect(result.every(c => c.count === 0)).toBe(true);
    });
});
