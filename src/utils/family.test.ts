import { describe, it, expect } from 'vitest';
import { analyzeFamilies } from './family';
import { Student } from './pco';

const mockStudent = (id: string, name: string, age: number, isChild: boolean, householdId: string): Student => ({
    id,
    name,
    age,
    isChild,
    householdId,
    pcoGrade: 0,
    birthdate: '2000-01-01',
    calculatedGrade: 0,
    delta: 0,
    lastCheckInAt: null,
    checkInCount: 0,
    groupCount: 0
});

describe('analyzeFamilies', () => {
    it('should identify critical issue when child is older than parent', () => {
        const students = [
            mockStudent('1', 'Dad', 10, false, 'h1'),
            mockStudent('2', 'Son', 40, true, 'h1')
        ];

        const issues = analyzeFamilies(students);
        expect(issues).toHaveLength(1);
        expect(issues[0].type).toBe('Critical');
        expect(issues[0].message).toContain('is older than Parent');
    });

    it('should identify warning when age gap is small', () => {
        const students = [
            mockStudent('1', 'Mom', 20, false, 'h2'),
            mockStudent('2', 'Daughter', 10, true, 'h2') // 10 year gap
        ];

        const issues = analyzeFamilies(students);
        expect(issues).toHaveLength(1);
        expect(issues[0].type).toBe('Warning');
        expect(issues[0].message).toContain('Small age gap');
    });

    it('should report no issues for normal families', () => {
        const students = [
            mockStudent('1', 'Dad', 40, false, 'h3'),
            mockStudent('2', 'Mom', 38, false, 'h3'),
            mockStudent('3', 'Son', 10, true, 'h3')
        ];

        const issues = analyzeFamilies(students);
        expect(issues).toHaveLength(0);
    });

    it('should handle multiple families', () => {
        const students = [
            // Family 1: Issue
            mockStudent('1', 'Dad1', 12, false, 'h1'),
            mockStudent('2', 'Son1', 5, true, 'h1'), // 7 year gap (Warning)

            // Family 2: OK
            mockStudent('3', 'Dad2', 40, false, 'h2'),
            mockStudent('4', 'Son2', 5, true, 'h2')
        ];

        const issues = analyzeFamilies(students);
        expect(issues).toHaveLength(1);
        expect(issues[0].householdId).toBe('h1');
    });

    it('should ignore singles or families with no children/parents mix', () => {
         const students = [
            mockStudent('1', 'Single', 30, false, 'h1'),
            mockStudent('2', 'Orphan1', 10, true, 'h2'),
            mockStudent('3', 'Orphan2', 12, true, 'h2')
        ];
         const issues = analyzeFamilies(students);
         expect(issues).toHaveLength(0);
    });
});
