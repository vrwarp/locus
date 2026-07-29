import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateNewsletter } from './newsletter';
import type { Student, PcoEvent } from './pco';

// The newsletter is a broadcast, so the birthday block is adults-only. These
// fixtures exist to hold that line: an earlier version of this suite was built
// entirely from `isChild: true` people and asserted their names *had* to appear,
// which meant the tests encoded the leak rather than catching it.
const person = (over: Partial<Student> & Pick<Student, 'id' | 'name' | 'birthdate' | 'age'>): Student => ({
    pcoGrade: null,
    isChild: false,
    gender: null,
    school: null,
    contactMethod: null,
    createdAt: '2020-01-01',
    ...over,
} as Student);

describe('Newsletter Architect Utilities', () => {
    let mockAdults: Student[];
    let mockEvents: PcoEvent[];

    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2024-03-24T12:00:00Z')); // March 24, 2024

        mockAdults = [
            person({ id: '1', name: 'Alice', birthdate: '1984-03-26', age: 39 }), // in 2 days
            person({ id: '2', name: 'Bob', birthdate: '1979-04-15', age: 44 }),   // in 22 days
            person({ id: '3', name: 'Charlie', birthdate: '1966-03-24', age: 58 }), // today
        ];

        mockEvents = [
            { id: '1', type: 'Event', attributes: { name: 'Sunday Worship Service', frequency: 'weekly' } },
            { id: '2', type: 'Event', attributes: { name: 'Youth Group Escape Room', frequency: 'one-time' } }
        ];
    });

    it('generates a newsletter with events and birthdays', () => {
        const md = generateNewsletter(mockEvents, mockAdults, { sermonTopic: 'The Prodigal Son' });

        expect(md).toContain('# Weekly Ministry Update');
        expect(md).toContain('## This Sunday: The Prodigal Son');
        expect(md).toContain('- **Sunday Worship Service**');
        expect(md).toContain('- **Youth Group Escape Room**');
        expect(md).toContain('Charlie (Mar 24)');
        expect(md).toContain('Alice (Mar 26)');
        expect(md).not.toContain('Bob'); // Not in next 7 days
    });

    it('never publishes a person flagged as a child', () => {
        const student = person({
            id: '10', name: 'Nicola', birthdate: '2010-03-26', age: 13, isChild: true, pcoGrade: 8,
        });

        const md = generateNewsletter([], [student], {});

        expect(md).not.toContain('Nicola');
        expect(md).toContain('*No birthdays in the next 7 days.*');
    });

    it('never publishes a minor whose child flag was never set', () => {
        // `isChild` is PCO's manually-maintained flag, so a teenager the office
        // never marked reads as an adult. Age has to catch them.
        const unflaggedTeen = person({
            id: '11', name: 'Jordan', birthdate: '2010-03-26', age: 13, isChild: false,
        });

        const md = generateNewsletter([], [unflaggedTeen], {});

        expect(md).not.toContain('Jordan');
    });

    it('never publishes a person with a placeholder birthdate', () => {
        // 1900-01-01 is a valid date that computes an implausible adult age, so
        // it clears an age >= 18 check while telling us nothing about the person.
        const placeholder = person({
            id: '12', name: 'Sentinel', birthdate: '1900-03-26', age: 124, isChild: false,
        });

        const md = generateNewsletter([], [placeholder], {});

        expect(md).not.toContain('Sentinel');
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

        const leapling = person({ id: '99', name: 'Leapling', birthdate: '1980-02-29', age: 44 });

        const md = generateNewsletter([], [leapling], {});
        expect(md).toContain('Leapling (Feb 29)');
    });
});
