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

    it('filters birthdays by target audience demographic', () => {
        // Charlie is Gen Z (2008), Alice is Gen Z (2010), Bob is Gen Z (2012)
        // Let's add a Millennial with a birthday tomorrow
        const millennialStudent: Student = {
            id: '4',
            name: 'David (Millennial)',
            birthdate: '1990-03-25', // Millennial (1981-1996)
            pcoGrade: null,
            isChild: false,
            gender: 'M',
            school: null,
            contactMethod: null,
            createdAt: '2020-01-01'
        };

        const students = [...mockStudents, millennialStudent];

        const mdGenZ = generateNewsletter([], students, { targetAudience: 'Gen Z' });
        expect(mdGenZ).toContain('Charlie');
        expect(mdGenZ).toContain('Alice');
        expect(mdGenZ).not.toContain('David');

        const mdMillennials = generateNewsletter([], students, { targetAudience: 'Millennials' });
        expect(mdMillennials).toContain('David');
        expect(mdMillennials).not.toContain('Charlie');
        expect(mdMillennials).not.toContain('Alice');
    });
});
