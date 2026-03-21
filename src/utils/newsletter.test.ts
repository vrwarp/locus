import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateNewsletterDraft } from './newsletter';
import type { Student, PcoEvent } from './pco';

describe('Newsletter Utility', () => {
    const createStudent = (id: string, name: string, birthdate: string): Student => ({
        id, age: 10, pcoGrade: 5, name, firstName: name.split(' ')[0], lastName: name.split(' ')[1] || '',
        birthdate, calculatedGrade: 5, delta: 0, lastCheckInAt: null, checkInCount: 0, groupCount: 0,
        isChild: true, householdId: '1', hasNameAnomaly: false, hasEmailAnomaly: false, hasPhoneAnomaly: false, hasAddressAnomaly: false, backgroundCheckExpiresAt: null
    });

    const createEvent = (id: string, name: string): PcoEvent => ({
        id,
        type: 'Event',
        attributes: { name }
    });

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('generates a draft with empty events and no birthdays', () => {
        vi.setSystemTime(new Date('2024-05-10'));
        const draft = generateNewsletterDraft([], []);
        expect(draft).toContain('Stay tuned for more upcoming events!');
        expect(draft).toContain('No upcoming birthdays this week.');
    });

    it('generates a draft with events and upcoming birthdays', () => {
        // Since getUpcomingBirthdays checks specifically for 'daysAhead' (default 7)
        // Let's use exactly 7 days from our mocked time.
        // Also it uses parseISO to extract month and date.
        // If mockToday is 2024-05-10, 7 days away is 2024-05-17.
        // However, parseISO('2014-05-17') without Z is assumed local.
        // Let's just use explicit UTC strings or rely on the same locale for both.
        vi.setSystemTime(new Date('2024-05-10'));
        const students = [
            createStudent('1', 'Birthday Boy', '2014-05-17')
        ];
        const events = [
            createEvent('1', 'Sunday Service'),
            createEvent('2', 'Youth Group')
        ];

        const draft = generateNewsletterDraft(events, students);

        // Verify events
        expect(draft).toContain('- **Sunday Service**: Join us for this upcoming event!');
        expect(draft).toContain('- **Youth Group**: Join us for this upcoming event!');

        // Verify birthdays
        expect(draft).toContain('- Birthday Boy (Turning 11)');
    });
});
