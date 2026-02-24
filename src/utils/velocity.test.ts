import { describe, it, expect } from 'vitest';
import { calculateCheckInVelocity } from './velocity';
import type { PcoCheckIn } from './pco';
import { formatISO, addDays } from 'date-fns';

describe('calculateCheckInVelocity', () => {
    it('should return empty array if no check-ins', () => {
        const result = calculateCheckInVelocity([]);
        expect(result).toEqual([]);
    });

    it('should filter non-Sunday check-ins', () => {
        // Construct explicit dates
        const sunday = new Date('2023-10-01T10:00:00'); // Sunday
        const mondayDate = new Date('2023-10-02T10:00:00'); // Monday

        const checkIns: PcoCheckIn[] = [
            { id: '1', type: 'CheckIn', attributes: { created_at: formatISO(sunday), kind: 'Regular' }, relationships: { person: { data: { type: 'Person', id: '1' } }, event: { data: { type: 'Event', id: '1' } } } },
            { id: '2', type: 'CheckIn', attributes: { created_at: formatISO(mondayDate), kind: 'Regular' }, relationships: { person: { data: { type: 'Person', id: '2' } }, event: { data: { type: 'Event', id: '1' } } } }
        ];

        const result = calculateCheckInVelocity(checkIns);
        // Should process Sunday check-in.
        // Check buckets. 10:00 AM = 600 mins.
        // Bucket 600.
        // Total Sundays = 1.
        // Average Rate = 1 / 1 / 5 = 0.2
        // Latest Rate = 1 / 5 = 0.2 (since it's the latest Sunday too)

        const bucket = result.find(b => b.time === '10:00');
        expect(bucket).toBeDefined();
        expect(bucket?.average).toBe(0.2);
    });

    it('should calculate average correctly across multiple Sundays', () => {
        const sunday1 = new Date('2023-10-01T10:00:00');
        const sunday2 = new Date('2023-10-08T10:00:00');

        const checkIns: PcoCheckIn[] = [
            // Sunday 1: 2 check-ins at 10:00
            { id: '1', type: 'CheckIn', attributes: { created_at: formatISO(sunday1), kind: 'Regular' }, relationships: { person: { data: { type: 'Person', id: '1' } }, event: { data: { type: 'Event', id: '1' } } } },
            { id: '2', type: 'CheckIn', attributes: { created_at: formatISO(sunday1), kind: 'Regular' }, relationships: { person: { data: { type: 'Person', id: '2' } }, event: { data: { type: 'Event', id: '1' } } } },
            // Sunday 2: 1 check-in at 10:00
            { id: '3', type: 'CheckIn', attributes: { created_at: formatISO(sunday2), kind: 'Regular' }, relationships: { person: { data: { type: 'Person', id: '3' } }, event: { data: { type: 'Event', id: '1' } } } }
        ];

        const result = calculateCheckInVelocity(checkIns);

        // Total Sundays = 2.
        // Bucket 10:00 (600 mins).
        // Total Check-ins = 3.
        // Average Volume = 3 / 2 = 1.5.
        // Average Rate = 1.5 / 5 = 0.3.

        // Latest Sunday is Sunday 2.
        // Latest Volume = 1.
        // Latest Rate = 1 / 5 = 0.2.

        const bucket = result.find(b => b.time === '10:00');
        expect(bucket).toBeDefined();
        expect(bucket?.average).toBe(0.3);
        expect(bucket?.latest).toBe(0.2);
    });
});
