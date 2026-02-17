import { describe, it, expect } from 'vitest';
import { calculateBurnoutRisk, classifyEvent } from './burnout';
import { Student, PcoEvent, PcoCheckIn } from './pco';
import { subWeeks, formatISO } from 'date-fns';

describe('Burnout Logic', () => {
    it('classifies events correctly', () => {
        const worship = { id: '1', type: 'Event', attributes: { name: 'Sunday Worship Service' } };
        const serving = { id: '2', type: 'Event', attributes: { name: 'Kids Ministry Team' } };
        const unknown = { id: '3', type: 'Event', attributes: { name: 'Picnic' } };

        expect(classifyEvent(worship as PcoEvent)).toBe('Worship');
        expect(classifyEvent(serving as PcoEvent)).toBe('Serving');
        expect(classifyEvent(unknown as PcoEvent)).toBe('Unknown');
    });

    it('calculates burnout risk correctly', () => {
        // Setup Date: 2024-03-01
        const baseDate = new Date('2024-03-01T10:00:00Z');
        const makeCheckIn = (personId: string, eventId: string, weeksAgo: number, kind: string = 'Regular'): PcoCheckIn => ({
            id: Math.random().toString(),
            type: 'CheckIn',
            attributes: {
                created_at: formatISO(subWeeks(baseDate, weeksAgo)),
                kind
            },
            relationships: {
                person: { data: { type: 'Person', id: personId } },
                event: { data: { type: 'Event', id: eventId } }
            }
        });

        const events: PcoEvent[] = [
            { id: '1', type: 'Event', attributes: { name: 'Worship Service' } },
            { id: '2', type: 'Event', attributes: { name: 'Kids Team' } }
        ];

        const people: Student[] = [
            { id: 'p1', name: 'Linda' } as any,
            { id: 'p2', name: 'Mark' } as any,
            { id: 'p3', name: 'Sarah' } as any
        ];

        const checkIns: PcoCheckIn[] = [];

        // Linda: 8 Serving, 0 Worship (High Risk)
        for (let i = 0; i < 8; i++) {
            checkIns.push(makeCheckIn('p1', '2', i));
        }

        // Mark: 8 Serving, 8 Worship (No Risk / Low Risk)
        for (let i = 0; i < 8; i++) {
            checkIns.push(makeCheckIn('p2', '2', i)); // Serving
            checkIns.push(makeCheckIn('p2', '1', i)); // Worship
        }

        // Sarah: 0 Serving, 8 Worship (No Risk)
        for (let i = 0; i < 8; i++) {
            checkIns.push(makeCheckIn('p3', '1', i));
        }

        const candidates = calculateBurnoutRisk(checkIns, events, people);

        expect(candidates).toHaveLength(1);
        expect(candidates[0].person.name).toBe('Linda');
        expect(candidates[0].riskLevel).toBe('High');
        expect(candidates[0].servingCount).toBe(8);
        expect(candidates[0].worshipCount).toBe(0);
    });

    it('identifies medium risk', () => {
         // Setup Date: 2024-03-01
        const baseDate = new Date('2024-03-01T10:00:00Z');
        const makeCheckIn = (personId: string, eventId: string, weeksAgo: number): PcoCheckIn => ({
            id: Math.random().toString(),
            type: 'CheckIn',
            attributes: {
                created_at: formatISO(subWeeks(baseDate, weeksAgo)),
                kind: 'Regular'
            },
            relationships: {
                person: { data: { type: 'Person', id: personId } },
                event: { data: { type: 'Event', id: eventId } }
            }
        });

        const events: PcoEvent[] = [
            { id: '1', type: 'Event', attributes: { name: 'Worship Service' } },
            { id: '2', type: 'Event', attributes: { name: 'Kids Team' } }
        ];

        const people: Student[] = [
            { id: 'p1', name: 'Medium' } as any
        ];

        const checkIns: PcoCheckIn[] = [];
        // Medium: 8 Serving, 2 Worship
        for (let i = 0; i < 8; i++) {
            checkIns.push(makeCheckIn('p1', '2', i));
        }
        checkIns.push(makeCheckIn('p1', '1', 0));
        checkIns.push(makeCheckIn('p1', '1', 1));

        const candidates = calculateBurnoutRisk(checkIns, events, people);

        expect(candidates).toHaveLength(1);
        expect(candidates[0].riskLevel).toBe('Medium');
        expect(candidates[0].worshipCount).toBe(2);
    });
});
