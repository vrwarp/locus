import { describe, it, expect } from 'vitest';
import { buildHouseholds, sortIntoGroups } from './sorter';
import type { Student } from './pco';

describe('Small Group Sorter', () => {
  const createStudent = (id: string, age: number, householdId: string | null, isChild: boolean = false): Student => ({
    id,
    age,
    householdId,
    isChild,
    name: `Student ${id}`,
    firstName: `First${id}`,
    lastName: `Last${id}`,
    pcoGrade: null,
    birthdate: '',
    calculatedGrade: 0,
    delta: 0,
    lastCheckInAt: null,
    checkInCount: null,
    groupCount: null,
    hasNameAnomaly: false,
    hasEmailAnomaly: false,
    hasAddressAnomaly: false,
    hasPhoneAnomaly: false,
  });

  describe('buildHouseholds', () => {
    it('groups adults by householdId and ignores children', () => {
      const students: Student[] = [
        createStudent('1', 30, 'h1'),
        createStudent('2', 28, 'h1'),
        createStudent('3', 10, 'h1', true), // child
        createStudent('4', 40, 'h2'),
        createStudent('5', 35, null)
      ];

      const households = buildHouseholds(students);
      expect(households).toHaveLength(3);

      const h1 = households.find(h => h.id === 'h1');
      expect(h1?.size).toBe(2);
      expect(h1?.averageAge).toBe(29);

      const h2 = households.find(h => h.id === 'h2');
      expect(h2?.size).toBe(1);

      const h5 = households.find(h => h.id === 'individual-5');
      expect(h5?.size).toBe(1);
      expect(h5?.averageAge).toBe(35);
    });
  });

  describe('sortIntoGroups', () => {
    it('returns empty groups if no adults provided', () => {
      const groups = sortIntoGroups([createStudent('1', 10, 'h1', true)], 2);
      expect(groups).toHaveLength(2);
      expect(groups[0].size).toBe(0);
      expect(groups[1].size).toBe(0);
    });

    it('returns empty array if groupCount <= 0', () => {
      expect(sortIntoGroups([createStudent('1', 30, 'h1')], 0)).toHaveLength(0);
    });

    it('balances households into target group count', () => {
      const students: Student[] = [
        createStudent('1', 20, 'h1'),
        createStudent('2', 20, 'h2'),
        createStudent('3', 40, 'h3'),
        createStudent('4', 40, 'h4')
      ];

      const groups = sortIntoGroups(students, 2, 100);
      expect(groups).toHaveLength(2);

      expect(groups[0].size).toBe(2);
      expect(groups[1].size).toBe(2);
      expect(groups[0].averageAge).toBe(30);
      expect(groups[1].averageAge).toBe(30);
    });

    it('keeps households together', () => {
      const students: Student[] = [
        createStudent('1', 30, 'h1'),
        createStudent('2', 30, 'h1'),
        createStudent('3', 40, 'h2')
      ];

      const groups = sortIntoGroups(students, 2, 100);
      expect(groups).toHaveLength(2);

      const groupWithH1 = groups.find(g => g.members.some(m => m.id === '1'))!;
      expect(groupWithH1.members.some(m => m.id === '2')).toBe(true);
    });

    it('handles more groups than households', () => {
      const students: Student[] = [
        createStudent('1', 30, 'h1')
      ];
      const groups = sortIntoGroups(students, 5, 10);
      expect(groups).toHaveLength(1);
    });
  });
});
