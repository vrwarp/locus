import { describe, it, expect } from 'vitest';
import { calculateBusFactor } from './busFactor';
import type { PcoCheckIn, PcoEvent, Student } from './pco';

describe('calculateBusFactor', () => {
  const mockStudent1 = { id: '1', name: 'Alice' } as Student;
  const mockStudent2 = { id: '2', name: 'Bob' } as Student;
  const mockStudent3 = { id: '3', name: 'Charlie' } as Student;
  const students = [mockStudent1, mockStudent2, mockStudent3];

  const mockEventServing = {
    id: 'e1',
    type: 'Event',
    attributes: { name: 'Kids Team' }
  } as PcoEvent;

  const mockEventWorship = {
    id: 'e2',
    type: 'Event',
    attributes: { name: 'Sunday Service' }
  } as PcoEvent;

  const events = [mockEventServing, mockEventWorship];

  it('identifies a solo volunteer correctly (simple case)', () => {
    // Alice serves alone 3 times (different days)
    const checkIns = [
      {
        id: 'c1',
        type: 'CheckIn',
        attributes: { created_at: '2023-01-01T09:00:00Z', kind: 'Volunteer' },
        relationships: { event: { data: { id: 'e1' } }, person: { data: { id: '1' } } }
      },
      {
        id: 'c2',
        type: 'CheckIn',
        attributes: { created_at: '2023-01-08T09:00:00Z', kind: 'Volunteer' },
        relationships: { event: { data: { id: 'e1' } }, person: { data: { id: '1' } } }
      },
      {
        id: 'c3',
        type: 'CheckIn',
        attributes: { created_at: '2023-01-15T09:00:00Z', kind: 'Volunteer' },
        relationships: { event: { data: { id: 'e1' } }, person: { data: { id: '1' } } }
      }
    ] as PcoCheckIn[];

    const result = calculateBusFactor(checkIns, events, students);
    expect(result).toHaveLength(1);
    expect(result[0].person.name).toBe('Alice');
    expect(result[0].soloCount).toBe(3);
    expect(result[0].totalServing).toBe(3);
  });

  it('clusters check-ins within 60 minutes as one team instance', () => {
    // Alice at 8:45, Bob at 9:15. Gap 30 mins. Should be 1 instance (Team Size 2).
    const checkIns = [
      {
        id: 'c1',
        type: 'CheckIn',
        attributes: { created_at: '2023-01-01T08:45:00Z', kind: 'Volunteer' },
        relationships: { event: { data: { id: 'e1' } }, person: { data: { id: '1' } } }
      },
      {
        id: 'c2',
        type: 'CheckIn',
        attributes: { created_at: '2023-01-01T09:15:00Z', kind: 'Volunteer' },
        relationships: { event: { data: { id: 'e1' } }, person: { data: { id: '2' } } }
      }
    ] as PcoCheckIn[];

    const result = calculateBusFactor(checkIns, events, students);
    // Neither should be solo.
    expect(result).toHaveLength(0);
  });

  it('separates check-ins > 60 minutes apart', () => {
    // Alice at 9:00 (Solo for 9am service)
    // Bob at 11:00 (Solo for 11am service)
    // Gap 120 mins. Should be 2 instances.
    const checkIns = [
      {
        id: 'c1',
        type: 'CheckIn',
        attributes: { created_at: '2023-01-01T09:00:00Z', kind: 'Volunteer' },
        relationships: { event: { data: { id: 'e1' } }, person: { data: { id: '1' } } }
      },
      {
        id: 'c2',
        type: 'CheckIn',
        attributes: { created_at: '2023-01-01T11:00:00Z', kind: 'Volunteer' },
        relationships: { event: { data: { id: 'e1' } }, person: { data: { id: '2' } } }
      }
    ] as PcoCheckIn[];

    const result = calculateBusFactor(checkIns, events, students);
    // Both should be solo.
    expect(result).toHaveLength(2);
    const alice = result.find(c => c.person.name === 'Alice');
    const bob = result.find(c => c.person.name === 'Bob');
    expect(alice).toBeDefined();
    expect(alice?.soloCount).toBe(1);
    expect(bob).toBeDefined();
    expect(bob?.soloCount).toBe(1);
  });
});
