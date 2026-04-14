import { describe, it, expect } from 'vitest';
import { calculateGivingTrends } from './givingTrends';
import type { PcoCheckIn, PcoEvent } from './pco';

describe('givingTrends Logic', () => {
    it('returns empty array if no worship event is found', () => {
        const events: PcoEvent[] = [
            { id: '1', type: 'Event', attributes: { name: 'Small Group' } }
        ] as any;

        expect(calculateGivingTrends([], events)).toEqual([]);
    });

    it('returns empty array if no checkins exist', () => {
        const events: PcoEvent[] = [
            { id: '1', type: 'Event', attributes: { name: 'Worship Service' } }
        ] as any;

        expect(calculateGivingTrends([], events)).toEqual([]);
    });

    it('aggregates unique attendees per week and calculates deterministic giving volume', () => {
        const events: PcoEvent[] = [
            { id: '1', type: 'Event', attributes: { name: 'Worship Service' } }
        ] as any;

        const checkIns: PcoCheckIn[] = [
            // Week 1: 2 unique attendees
            {
                id: '101',
                type: 'CheckIn',
                attributes: { created_at: '2024-01-07T10:00:00Z', kind: 'Regular' }, // Sunday
                relationships: { person: { data: { id: 'p1', type: 'Person' } }, event: { data: { id: '1', type: 'Event' } } }
            },
            {
                id: '102',
                type: 'CheckIn',
                attributes: { created_at: '2024-01-07T10:00:00Z', kind: 'Regular' },
                relationships: { person: { data: { id: 'p2', type: 'Person' } }, event: { data: { id: '1', type: 'Event' } } }
            },
            // Duplicate checkin for p1 same week (should be ignored for attendance count)
            {
                id: '103',
                type: 'CheckIn',
                attributes: { created_at: '2024-01-07T12:00:00Z', kind: 'Regular' },
                relationships: { person: { data: { id: 'p1', type: 'Person' } }, event: { data: { id: '1', type: 'Event' } } }
            },

            // Week 2: 1 unique attendee
            {
                id: '104',
                type: 'CheckIn',
                attributes: { created_at: '2024-01-14T10:00:00Z', kind: 'Regular' }, // Next Sunday
                relationships: { person: { data: { id: 'p1', type: 'Person' } }, event: { data: { id: '1', type: 'Event' } } }
            }
        ] as any;

        const results = calculateGivingTrends(checkIns, events);

        expect(results).toHaveLength(2);

        // Week 1
        expect(results[0].weekStarting).toBe('2024-01-07');
        expect(results[0].attendance).toBe(2);
        // Base giving = 2 * 25 = 50. Index 0: variance multiplier = 1 + sin(0)*0.15 = 1.
        expect(results[0].givingVolume).toBe(50);

        // Week 2
        expect(results[1].weekStarting).toBe('2024-01-14');
        expect(results[1].attendance).toBe(1);
        // Base giving = 1 * 25 = 25. Index 1: variance multiplier = 1 + sin(1.5)*0.15 = 1 + 0.997*0.15 = ~1.15
        // 25 * 1.15 = 28.75 => 29
        expect(results[1].givingVolume).toBeGreaterThan(25);
        expect(results[1].givingVolume).toBeLessThanOrEqual(29); // Math.round(25 * (1 + Math.sin(1.5)*0.15)) -> 29
    });

    it('ignores checkins that are not Regular or for other events', () => {
         const events: PcoEvent[] = [
            { id: '1', type: 'Event', attributes: { name: 'Worship Service' } },
            { id: '2', type: 'Event', attributes: { name: 'Small Group' } }
        ] as any;

        const checkIns: PcoCheckIn[] = [
            // Ignored: Volunteer kind
            {
                id: '101',
                type: 'CheckIn',
                attributes: { created_at: '2024-01-07T10:00:00Z', kind: 'Volunteer' },
                relationships: { person: { data: { id: 'p1', type: 'Person' } }, event: { data: { id: '1', type: 'Event' } } }
            },
            // Ignored: Wrong event
            {
                id: '102',
                type: 'CheckIn',
                attributes: { created_at: '2024-01-07T10:00:00Z', kind: 'Regular' },
                relationships: { person: { data: { id: 'p2', type: 'Person' } }, event: { data: { id: '2', type: 'Event' } } }
            },
            // Ignored: Missing created_at
             {
                id: '103',
                type: 'CheckIn',
                attributes: { kind: 'Regular' },
                relationships: { person: { data: { id: 'p3', type: 'Person' } }, event: { data: { id: '1', type: 'Event' } } }
            }
        ] as any;

         const results = calculateGivingTrends(checkIns, events);
         expect(results).toEqual([]);
    });
});
