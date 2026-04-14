import { describe, it, expect } from 'vitest';
import { correlateGivingAndAttendance } from './givingTrends';
import type { PcoCheckIn, PcoEvent } from './pco';

describe('givingTrends', () => {
  it('should return empty if no worship event', () => {
    const events = [{ id: '1', type: 'Event', attributes: { name: 'Friday Night Live' } }];
    const checkIns = [];
    const result = correlateGivingAndAttendance(checkIns as PcoCheckIn[], events as PcoEvent[]);
    expect(result).toEqual([]);
  });

  it('should correctly group attendance by week and calculate giving volume', () => {
    const events: PcoEvent[] = [{ id: '1', type: 'Event', attributes: { name: 'Sunday Worship Service' } }];

    // Create check-ins for two distinct weeks
    const checkIns: Partial<PcoCheckIn>[] = [
      {
        id: '1',
        attributes: { created_at: '2023-10-01T10:00:00Z', kind: 'Regular' }, // Sunday
        relationships: { event: { data: { type: 'Event', id: '1' } }, person: { data: { type: 'Person', id: 'p1' } } }
      },
      {
        id: '2',
        attributes: { created_at: '2023-10-01T10:00:00Z', kind: 'Regular' }, // Sunday
        relationships: { event: { data: { type: 'Event', id: '1' } }, person: { data: { type: 'Person', id: 'p2' } } }
      },
      {
        id: '3',
        attributes: { created_at: '2023-10-08T10:00:00Z', kind: 'Regular' }, // Next Sunday
        relationships: { event: { data: { type: 'Event', id: '1' } }, person: { data: { type: 'Person', id: 'p1' } } }
      }
    ];

    const result = correlateGivingAndAttendance(checkIns as PcoCheckIn[], events as PcoEvent[]);

    expect(result.length).toBe(2);

    // Check first week (index 0)
    // attendance = 2
    // base = 10000, perPerson = 50 * 2 = 100, noise = (0 % 10) * 100 - 450 = -450
    // total = 10000 + 100 - 450 = 9650
    expect(result[0].weekStarting).toBe('2023-10-01');
    expect(result[0].attendance).toBe(2);
    expect(result[0].givingVolume).toBe(9650);

    // Check second week (index 1)
    // attendance = 1
    // base = 10000, perPerson = 50 * 1 = 50, noise = (1 % 10) * 100 - 450 = -350
    // total = 10000 + 50 - 350 = 9700
    expect(result[1].weekStarting).toBe('2023-10-08');
    expect(result[1].attendance).toBe(1);
    expect(result[1].givingVolume).toBe(9700);
  });

  it('should ignore duplicate check-ins for the same person in the same week', () => {
    const events: PcoEvent[] = [{ id: '1', type: 'Event', attributes: { name: 'Sunday Worship Service' } }];

    const checkIns: Partial<PcoCheckIn>[] = [
      {
        id: '1',
        attributes: { created_at: '2023-10-01T10:00:00Z', kind: 'Regular' },
        relationships: { event: { data: { type: 'Event', id: '1' } }, person: { data: { type: 'Person', id: 'p1' } } }
      },
      {
        id: '2',
        attributes: { created_at: '2023-10-01T10:05:00Z', kind: 'Regular' }, // Duplicate check-in
        relationships: { event: { data: { type: 'Event', id: '1' } }, person: { data: { type: 'Person', id: 'p1' } } }
      }
    ];

    const result = correlateGivingAndAttendance(checkIns as PcoCheckIn[], events as PcoEvent[]);
    expect(result.length).toBe(1);
    expect(result[0].attendance).toBe(1);
  });
});
