import { describe, it, expect } from 'vitest';
import { calculateExpectedGrade } from './grader';

describe('Grader Logic', () => {
  it('correctly identifies a 1st grader (Age 6)', () => {
    const dob = new Date('2018-05-20'); // 6 years old in 2024
    const schoolYear = new Date('2024-10-01');
    expect(calculateExpectedGrade(dob, schoolYear)).toBe(1);
  });

  it('handles the cutoff date edge case strictly', () => {
    const lateBorn = new Date('2018-09-02'); // Born after Sept 1
    const schoolYear = new Date('2024-10-01');
    expect(calculateExpectedGrade(lateBorn, schoolYear)).toBe(0); // Kindergarten
  });

  it('respects custom cutoff dates', () => {
    const dob = new Date('2018-09-02'); // Born Sept 2nd
    const schoolYear = new Date('2024-10-01');

    // Default cutoff is Sept 1, so this kid misses it (Grade 0)
    expect(calculateExpectedGrade(dob, schoolYear)).toBe(0);

    // With cutoff Oct 1, they should make it (Grade 1)
    expect(calculateExpectedGrade(dob, schoolYear, { cutoffMonth: 9, cutoffDay: 1 })).toBe(1);
  });
});
