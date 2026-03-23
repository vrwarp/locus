import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateNewsletter } from './newsletter';
import type { Student, PcoEvent } from './pco';

describe('Newsletter Architect Utilities', () => {
    let mockStudents: Student[];
    let mockEvents: PcoEvent[];

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-03-24T12:00:00Z')); // March 24, 2024

        mockStudents = [
            {
                id: '1',
                name: 'Alice',
                birthdate: '2010-03-26', // Birthday in 2 days
                pcoGrade: 8,
                isChild: true,
                gender: 'F',
                school: null,
                contactMethod: null,
                createdAt: '2020-01-01'
            },
            {
                id: '2',
                name: 'Bob',
                birthdate: '2012-04-15', // Birthday in 22 days (not in next 7)
                pcoGrade: 6,
                isChild: true,
                gender: 'M',
                school: null,
                contactMethod: null,
                createdAt: '2020-01-01'
            },
            {
                id: '3',
                name: 'Charlie',
                birthdate: '2008-03-24', // Birthday TODAY
                pcoGrade: 10,
                isChild: true,
                gender: 'M',
                school: null,
                contactMethod: null,
                createdAt: '2020-01-01'
            }
        ];

        mockEvents = [
            { id: '1', type: 'Event', attributes: { name: 'Sunday Worship Service', frequency: 'weekly' } },
            { id: '2', type: 'Event', attributes: { name: 'Youth Group Escape Room', frequency: 'one-time' } }
        ];
    });

    it('generates a newsletter with events and birthdays', () => {
        const md = generateNewsletter(mockEvents, mockStudents, { sermonTopic: 'The Prodigal Son' });

        expect(md).toContain('# Weekly Ministry Update');
        expect(md).toContain('## This Sunday: The Prodigal Son');
        expect(md).toContain('- **Sunday Worship Service**');
        expect(md).toContain('- **Youth Group Escape Room**');
        expect(md).toContain('Charlie (Mar 24)');
        expect(md).toContain('Alice (Mar 26)');
        expect(md).not.toContain('Bob'); // Not in next 7 days
    });

    it('handles empty events and empty birthdays gracefully', () => {
        const md = generateNewsletter([], [], {});

        expect(md).toContain('*No major events scheduled for this week.*');
        expect(md).toContain('*No birthdays in the next 7 days.*');
    });

    it('includes pastor notes if provided', () => {
        const notes = 'Hello church family! It has been a wonderful week.';
        const md = generateNewsletter([], [], { pastorNotes: notes });
        expect(md).toContain(notes);
    });

    it('handles leap year birthdays', () => {
        vi.setSystemTime(new Date('2024-02-28T12:00:00Z')); // Leap year, Feb 28

        const leapStudent: Student = {
            id: '99',
            name: 'Leapling',
            birthdate: '2020-02-29',
            pcoGrade: null,
            isChild: true,
            gender: 'F',
            school: null,
            contactMethod: null,
            createdAt: '2020-01-01'
        };

        const md = generateNewsletter([], [leapStudent], {});
        expect(md).toContain('Leapling (Feb 29)');
    });
});
