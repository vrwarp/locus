import { describe, it, expect } from 'vitest';
import { calculateDemographics, GENERATIONS } from './demographics';
import type { Student } from './pco';

const createStudent = (birthdate: string | null): Student => ({
  id: '1',
  age: 0,
  pcoGrade: null,
  name: 'Test',
  firstName: 'Test',
  lastName: 'User',
  birthdate: birthdate as string,
  calculatedGrade: 0,
  delta: 0,
  lastCheckInAt: null,
  checkInCount: null,
  groupCount: null,
  isChild: false,
  householdId: null,
  hasNameAnomaly: false,
  hasEmailAnomaly: false,
  hasAddressAnomaly: false,
  hasPhoneAnomaly: false,
});

describe('Demographics Utils', () => {
  it('returns empty counts for empty input', () => {
    const result = calculateDemographics([]);
    result.forEach(gen => {
      expect(gen.count).toBe(0);
    });
    expect(result.length).toBe(GENERATIONS.length);
  });

  it('correctly categorizes Gen Alpha', () => {
    const students = [createStudent('2015-01-01')]; // 2015 is Alpha
    const result = calculateDemographics(students);
    const alpha = result.find(g => g.name === 'Gen Alpha');
    expect(alpha?.count).toBe(1);
  });

  it('correctly categorizes multiple generations', () => {
    const students = [
      createStudent('2015-01-01'), // Alpha
      createStudent('2000-01-01'), // Z
      createStudent('1990-01-01'), // Millennial
      createStudent('1970-01-01'), // X
    ];
    const result = calculateDemographics(students);
    expect(result.find(g => g.name === 'Gen Alpha')?.count).toBe(1);
    expect(result.find(g => g.name === 'Gen Z')?.count).toBe(1);
    expect(result.find(g => g.name === 'Millennials')?.count).toBe(1);
    expect(result.find(g => g.name === 'Gen X')?.count).toBe(1);
    expect(result.find(g => g.name === 'Boomers')?.count).toBe(0);
  });

  it('ignores invalid dates', () => {
    const students = [createStudent('invalid-date'), createStudent(null)];
    const result = calculateDemographics(students);
    result.forEach(gen => expect(gen.count).toBe(0));
  });

  it('handles edge cases (start/end years)', () => {
      // Gen Z: 1997-2012
      const students = [
          createStudent('1997-01-01'),
          createStudent('2012-12-31')
      ];
      const result = calculateDemographics(students);
      expect(result.find(g => g.name === 'Gen Z')?.count).toBe(2);
  });
});
