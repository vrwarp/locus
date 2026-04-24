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
