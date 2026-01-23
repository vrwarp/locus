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
});
