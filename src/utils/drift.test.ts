import { describe, it, expect } from 'vitest';
import { calculateDrift } from './drift';
import type { Student, PcoCheckIn } from './pco';
import { subDays, formatISO } from 'date-fns';

describe('calculateDrift', () => {
  const mockReferenceDate = new Date('2023-10-01T12:00:00Z');

  const createMockStudent = (id: string, name: string): Student => ({
    id,
    name,
    firstName: name.split(' ')[0],
    lastName: name.split(' ')[1] || '',
    age: 30,
    pcoGrade: null,
    birthdate: '1993-01-01',
    calculatedGrade: -1,
    delta: 0,
    lastCheckInAt: null,
    checkInCount: null,
    isChild: false,
    createdAt: '2020-01-01T00:00:00Z',
    householdId: null,
    hasNameAnomaly: false
  });

  const createMockCheckIn = (personId: string, daysAgo: number): PcoCheckIn => {
    const date = subDays(mockReferenceDate, daysAgo);
    return {
      id: `ci-${Math.random()}`,
      type: 'CheckIn',
      attributes: {
        created_at: formatISO(date),
        kind: 'Regular'
      },
      relationships: {
        person: { data: { type: 'Person', id: personId } },
        event: { data: { type: 'Event', id: 'evt-1' } }
      }
    };
  };

  it('identifies drift correctly (50%+ drop)', () => {
    const students = [createMockStudent('1', 'Drifting Person')];
    const checkIns = [
      createMockCheckIn('1', 10), // 1 recent
      createMockCheckIn('1', 100), // 3 previous
      createMockCheckIn('1', 120),
      createMockCheckIn('1', 150),
    ];

    const results = calculateDrift(students, checkIns, mockReferenceDate);

    expect(results).toHaveLength(1);
    expect(results[0].student.id).toBe('1');
    expect(results[0].previousCount).toBe(3);
    expect(results[0].recentCount).toBe(1);
    expect(results[0].dropPercentage).toBe(Math.round((2 / 3) * 100)); // ~67%
  });

  it('does not flag members with <50% drop', () => {
    const students = [createMockStudent('2', 'Steady Person')];
    const checkIns = [
      createMockCheckIn('2', 10), // 2 recent
      createMockCheckIn('2', 20),
      createMockCheckIn('2', 100), // 3 previous
      createMockCheckIn('2', 120),
      createMockCheckIn('2', 150),
    ];

    const results = calculateDrift(students, checkIns, mockReferenceDate);

    expect(results).toHaveLength(0); // 3 -> 2 is a 33% drop, < 50%
  });

  it('handles members with no previous check-ins (no drift to measure)', () => {
    const students = [createMockStudent('3', 'New Person')];
    const checkIns = [
      createMockCheckIn('3', 10), // 1 recent
      createMockCheckIn('3', 20), // 2 recent
    ];

    const results = calculateDrift(students, checkIns, mockReferenceDate);

    expect(results).toHaveLength(0);
  });

  it('handles members with no check-ins at all', () => {
     const students = [createMockStudent('4', 'Ghost Person')];
     const checkIns: PcoCheckIn[] = [];

     const results = calculateDrift(students, checkIns, mockReferenceDate);
     expect(results).toHaveLength(0);
  });

  it('identifies complete drop off (100% drop)', () => {
     const students = [createMockStudent('5', 'Gone Person')];
     const checkIns = [
      createMockCheckIn('5', 100), // 2 previous
      createMockCheckIn('5', 120),
    ];

    const results = calculateDrift(students, checkIns, mockReferenceDate);

    expect(results).toHaveLength(1);
    expect(results[0].student.id).toBe('5');
    expect(results[0].previousCount).toBe(2);
    expect(results[0].recentCount).toBe(0);
    expect(results[0].dropPercentage).toBe(100);
  });
});
