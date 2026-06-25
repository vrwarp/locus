import { describe, it, expect } from 'vitest';
import { correlateSermonsAndAttendance, correlateSermonsWithEngagement, SERMON_TOPICS } from './sermons';
import type { PcoCheckIn, PcoEvent } from './pco';

describe('sermons', () => {
  it('should return empty if no worship event', () => {
    const events = [{ id: '1', type: 'Event', attributes: { name: 'Friday Night Live' } }];
    const checkIns = [];
    const result = correlateSermonsAndAttendance(checkIns as PcoCheckIn[], events as PcoEvent[]);
    expect(result).toEqual([]);
  });

  it('should correctly group attendance by week and assign topics', () => {
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

    const result = correlateSermonsAndAttendance(checkIns as PcoCheckIn[], events as PcoEvent[]);

    expect(result.length).toBe(2);

    // Check first week
    expect(result[0].weekStarting).toBe('2023-10-01');
    expect(result[0].attendance).toBe(2);
    expect(result[0].topic).toBe(SERMON_TOPICS[0]);

    // Check second week
    expect(result[1].weekStarting).toBe('2023-10-08');
    expect(result[1].attendance).toBe(1);
    expect(result[1].topic).toBe(SERMON_TOPICS[1]);

    // Check giving volume is generated
    expect(result[0].givingVolume).toBeDefined();
    expect(result[0].givingVolume).toBeGreaterThan(0);
    expect(result[1].givingVolume).toBeDefined();
    expect(result[1].givingVolume).toBeGreaterThan(0);
  });

  it('should spike giving volume for generous topics', () => {
    const events: PcoEvent[] = [{ id: '1', type: 'Event', attributes: { name: 'Sunday Worship Service' } }];

    // Add a check in for Week 5, index 4 (Living Generously)
    const checkIns: Partial<PcoCheckIn>[] = [];
    for (let i = 0; i < 5; i++) {
        // Distribute across 5 distinct weeks to push the index to 4
        // Adding 7 days per increment so they end up in different weeks
        const dateDay = 1 + (i * 7);
        const dateStr = dateDay < 10 ? `0${dateDay}` : `${dateDay}`;
        checkIns.push({
            id: `c${i}`,
            attributes: { created_at: `2023-10-${dateStr}T10:00:00Z`, kind: 'Regular' },
            relationships: { event: { data: { type: 'Event', id: '1' } }, person: { data: { type: 'Person', id: `p${i}` } } }
        });
    }

    const result = correlateSermonsAndAttendance(checkIns as PcoCheckIn[], events as PcoEvent[]);

    // index 4 is 'Living Generously'
    const generousWeek = result.find(r => r.topic === 'Living Generously');
    expect(generousWeek).toBeDefined();

    // Manual calculation of base giving for attendance 1 at index 4
    const baseGiving = 1 * 25;
    const varianceMultiplier = 1 + (Math.sin(4 * 1.5) * 0.15);
    const regularGiving = Math.round(baseGiving * varianceMultiplier);

    // The generous logic multiplies it by 1.5
    expect(generousWeek!.givingVolume).toBe(Math.round(regularGiving * 1.5));
  });

  it('should filter attendance by demographic when specified', () => {
    const events: PcoEvent[] = [{ id: '1', type: 'Event', attributes: { name: 'Sunday Worship Service' } }];

    // One Millennial (born 1990), one Gen Z (born 2005)
    const mockStudents: any[] = [
      { id: 'p1', birthdate: '1990-01-01' },
      { id: 'p2', birthdate: '2005-01-01' }
    ];

    const checkIns: Partial<PcoCheckIn>[] = [
      {
        id: '1',
        attributes: { created_at: '2023-10-01T10:00:00Z', kind: 'Regular' },
        relationships: { event: { data: { type: 'Event', id: '1' } }, person: { data: { type: 'Person', id: 'p1' } } }
      },
      {
        id: '2',
        attributes: { created_at: '2023-10-01T10:00:00Z', kind: 'Regular' },
        relationships: { event: { data: { type: 'Event', id: '1' } }, person: { data: { type: 'Person', id: 'p2' } } }
      }
    ];

    // Filter by Millennials
    const result = correlateSermonsAndAttendance(checkIns as PcoCheckIn[], events as PcoEvent[], mockStudents, ['Millennials']);

    expect(result.length).toBe(1);
    expect(result[0].attendance).toBe(1); // Only p1 (Millennial) counted
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

    const result = correlateSermonsAndAttendance(checkIns as PcoCheckIn[], events as PcoEvent[]);
    expect(result.length).toBe(1);
    expect(result[0].attendance).toBe(1);
  });

  describe('correlateSermonsWithEngagement', () => {
    it('should derive deterministic engagement spikes from topics', () => {
        const events: PcoEvent[] = [{ id: '1', type: 'Event', attributes: { name: 'Sunday Worship Service' } }];

        const checkIns: Partial<PcoCheckIn>[] = [];

        for (let i = 0; i < 100; i++) {
            // Note that topics are assigned based on the week index in sorted order,
            // not the date's week number. We will insert check-ins for enough weeks
            // to reach topic index 2 ("Community Matters") and index 5 ("Finding Purpose").
            checkIns.push({
                id: `c1-${i}`,
                attributes: { created_at: '2023-10-01T10:00:00Z', kind: 'Regular' }, // index 0
                relationships: { event: { data: { type: 'Event', id: '1' } }, person: { data: { type: 'Person', id: `p${i}` } } }
            });
            checkIns.push({
                id: `c2-${i}`,
                attributes: { created_at: '2023-10-08T10:00:00Z', kind: 'Regular' }, // index 1
                relationships: { event: { data: { type: 'Event', id: '1' } }, person: { data: { type: 'Person', id: `p${i}` } } }
            });
            checkIns.push({
                id: `c3-${i}`,
                attributes: { created_at: '2023-10-15T10:00:00Z', kind: 'Regular' }, // index 2 -> Community Matters
                relationships: { event: { data: { type: 'Event', id: '1' } }, person: { data: { type: 'Person', id: `p${i}` } } }
            });
            checkIns.push({
                id: `c4-${i}`,
                attributes: { created_at: '2023-10-22T10:00:00Z', kind: 'Regular' }, // index 3
                relationships: { event: { data: { type: 'Event', id: '1' } }, person: { data: { type: 'Person', id: `p${i}` } } }
            });
            checkIns.push({
                id: `c5-${i}`,
                attributes: { created_at: '2023-10-29T10:00:00Z', kind: 'Regular' }, // index 4
                relationships: { event: { data: { type: 'Event', id: '1' } }, person: { data: { type: 'Person', id: `p${i}` } } }
            });
            checkIns.push({
                id: `c6-${i}`,
                attributes: { created_at: '2023-11-05T10:00:00Z', kind: 'Regular' }, // index 5 -> Finding Purpose
                relationships: { event: { data: { type: 'Event', id: '1' } }, person: { data: { type: 'Person', id: `p${i}` } } }
            });
        }

        const result = correlateSermonsWithEngagement(checkIns as PcoCheckIn[], events as PcoEvent[]);

        // Check Week 1 (Base rates)
        const week1 = result.find(r => r.topic === 'The Prodigal Son');
        expect(week1!.smallGroupSignups).toBe(5); // 5% of 100
        expect(week1!.volunteerApplications).toBe(2); // 2% of 100

        // Check Week 3 ("Community Matters" -> 50% spike in small groups)
        const week3 = result.find(r => r.topic === 'Community Matters');
        expect(week3!.smallGroupSignups).toBe(8); // 5 * 1.5 = 7.5 -> 8
        expect(week3!.volunteerApplications).toBe(2); // Unchanged

        // Check Week 6 ("Finding Purpose" -> 400% spike in volunteers)
        const week6 = result.find(r => r.topic === 'Finding Purpose');
        expect(week6!.smallGroupSignups).toBe(5); // Unchanged
        expect(week6!.volunteerApplications).toBe(8); // 2 * 4 = 8
    });
  });
});
