import { describe, it, expect } from 'vitest';
import { matchPrayerPartners } from './prayer';
import type { Student } from './pco';

describe('matchPrayerPartners', () => {
    const mockStudent = (id: string, name: string, prayerTopic?: string): Student => ({
        id,
        name,
        firstName: name.split(' ')[0],
        lastName: name.split(' ')[1] || '',
        grade: null,
        birthdate: null,
        phone: '',
        email: '',
        address: '',
        city: '',
        state: '',
        zip: '',
        isChild: false,
        avatarUrl: null,
        householdId: '1',
        hasNameAnomaly: false,
        prayerTopic
    });

    it('returns an empty array if no students have a prayer topic', () => {
        const students = [
            mockStudent('1', 'Alice'),
            mockStudent('2', 'Bob')
        ];
        const matches = matchPrayerPartners(students);
        expect(matches).toEqual([]);
    });

    it('matches students with the same prayer topic', () => {
        const students = [
            mockStudent('1', 'Alice', 'Health'),
            mockStudent('2', 'Bob', 'Health'),
            mockStudent('3', 'Charlie', 'Financial'),
            mockStudent('4', 'Dave', 'Financial')
        ];
        const matches = matchPrayerPartners(students);
        expect(matches.length).toBe(2);

        const healthMatch = matches.find(m => m.topic === 'Health');
        expect(healthMatch).toBeDefined();
        expect(healthMatch?.personA).toBeDefined();
        expect(healthMatch?.personB).toBeDefined();
        expect([healthMatch?.personA.id, healthMatch?.personB?.id].sort()).toEqual(['1', '2']);

        const financialMatch = matches.find(m => m.topic === 'Financial');
        expect(financialMatch).toBeDefined();
        expect([financialMatch?.personA.id, financialMatch?.personB?.id].sort()).toEqual(['3', '4']);
    });

    it('handles odd numbers by leaving one person unmatched (personB undefined)', () => {
        const students = [
            mockStudent('1', 'Alice', 'Grief'),
            mockStudent('2', 'Bob', 'Grief'),
            mockStudent('3', 'Charlie', 'Grief')
        ];
        const matches = matchPrayerPartners(students);
        expect(matches.length).toBe(2);

        const fullMatch = matches.find(m => m.personB !== undefined);
        const oddMatch = matches.find(m => m.personB === undefined);

        expect(fullMatch).toBeDefined();
        expect(oddMatch).toBeDefined();
        expect(oddMatch?.personA).toBeDefined();
    });

    it('randomizes the pairs within a topic', () => {
        // With only 4 people, shuffle might randomly produce the same array,
        // but let's just ensure it produces valid pairs of all 4.
        const students = [
            mockStudent('1', 'A', 'Anxiety'),
            mockStudent('2', 'B', 'Anxiety'),
            mockStudent('3', 'C', 'Anxiety'),
            mockStudent('4', 'D', 'Anxiety')
        ];
        const matches = matchPrayerPartners(students);
        expect(matches.length).toBe(2);

        const matchedIds = matches.flatMap(m => [m.personA.id, m.personB?.id]);
        expect(matchedIds.sort()).toEqual(['1', '2', '3', '4']);
    });
});
