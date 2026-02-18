import { describe, it, expect } from 'vitest';
import { calculateRecruitmentCandidates } from './recruitment';
import type { Student, PcoCheckIn, PcoEvent } from './pco';
import { formatISO, subWeeks } from 'date-fns';

describe('Recruitment Logic', () => {
    // Helpers
    const createPerson = (id: string, name: string, isChild: boolean, householdId: string | null = null): Student => ({
        id,
        name,
        firstName: name.split(' ')[0],
        lastName: name.split(' ')[1] || '',
        isChild,
        householdId,
        age: isChild ? 10 : 35,
        pcoGrade: isChild ? 5 : null,
        calculatedGrade: 5,
        delta: 0,
        birthdate: '1990-01-01',
        lastCheckInAt: null,
        checkInCount: null,
        groupCount: null,
        hasNameAnomaly: false,
        hasEmailAnomaly: false,
        hasAddressAnomaly: false,
        hasPhoneAnomaly: false,
    });

    const createEvent = (id: string, name: string): PcoEvent => ({
        id,
        type: 'Event',
        attributes: { name, frequency: 'weekly' }
    });

    const createCheckIn = (id: string, personId: string, eventId: string, weeksAgo: number, kind: string = 'Regular'): PcoCheckIn => ({
        id,
        type: 'CheckIn',
        attributes: {
            created_at: formatISO(subWeeks(new Date(), weeksAgo)),
            kind
        },
        relationships: {
            person: { data: { type: 'Person', id: personId } },
            event: { data: { type: 'Event', id: eventId } }
        }
    });

    it('identifies High Worship / Low Serving adults as candidates', () => {
        const people = [
            createPerson('1', 'Sarah Saint', false), // Target
        ];
        const events = [
            createEvent('100', 'Sunday Worship'),
        ];
        const checkIns: PcoCheckIn[] = [];

        // Sarah: 5 Worship check-ins in last 8 weeks
        for(let i=0; i<5; i++) {
            checkIns.push(createCheckIn(`c${i}`, '1', '100', i));
        }

        const candidates = calculateRecruitmentCandidates(checkIns, events, people);

        expect(candidates).toHaveLength(1);
        expect(candidates[0].person.name).toBe('Sarah Saint');
        expect(candidates[0].worshipCount).toBe(5);
        expect(candidates[0].score).toBe(50); // 5 * 10
    });

    it('excludes High Serving volunteers', () => {
        const people = [
            createPerson('2', 'Linda Leader', false),
        ];
        const events = [
            createEvent('200', 'Kids Team'),
        ];
        const checkIns: PcoCheckIn[] = [];

        // Linda: 6 Serving check-ins
        for(let i=0; i<6; i++) {
            checkIns.push(createCheckIn(`c${i}`, '2', '200', i));
        }

        const candidates = calculateRecruitmentCandidates(checkIns, events, people);
        expect(candidates).toHaveLength(0);
    });

    it('excludes children', () => {
         const people = [
            createPerson('3', 'Timmy Tiny', true),
        ];
        const events = [
            createEvent('100', 'Sunday Worship'),
        ];
        const checkIns: PcoCheckIn[] = [];

        // Timmy: 5 Worship check-ins
        for(let i=0; i<5; i++) {
            checkIns.push(createCheckIn(`c${i}`, '3', '100', i));
        }

        const candidates = calculateRecruitmentCandidates(checkIns, events, people);
        expect(candidates).toHaveLength(0);
    });

    it('boosts score for parents', () => {
        const people = [
            createPerson('4', 'Papa Bear', false, 'household_A'),
            createPerson('5', 'Baby Bear', true, 'household_A'),
        ];
        const events = [
            createEvent('100', 'Sunday Worship'),
        ];
        const checkIns: PcoCheckIn[] = [];

        // Papa Bear: 4 Worship check-ins
        for(let i=0; i<4; i++) {
            checkIns.push(createCheckIn(`c${i}`, '4', '100', i));
        }

        const candidates = calculateRecruitmentCandidates(checkIns, events, people);

        expect(candidates).toHaveLength(1);
        expect(candidates[0].person.name).toBe('Papa Bear');
        expect(candidates[0].isParent).toBe(true);
        expect(candidates[0].score).toBe(60); // (4 * 10) + 20
    });

    it('sorts by score descending', () => {
         const people = [
            createPerson('1', 'Sarah Saint', false), // Score 50
            createPerson('4', 'Papa Bear', false, 'household_A'), // Score 60 (Parent)
             createPerson('5', 'Baby Bear', true, 'household_A'),
        ];
        const events = [
            createEvent('100', 'Sunday Worship'),
        ];
        const checkIns: PcoCheckIn[] = [];

         // Sarah: 5 Worship check-ins
        for(let i=0; i<5; i++) {
            checkIns.push(createCheckIn(`c_s_${i}`, '1', '100', i));
        }

         // Papa Bear: 4 Worship check-ins
        for(let i=0; i<4; i++) {
            checkIns.push(createCheckIn(`c_p_${i}`, '4', '100', i));
        }

        const candidates = calculateRecruitmentCandidates(checkIns, events, people);
        expect(candidates).toHaveLength(2);
        expect(candidates[0].person.name).toBe('Papa Bear'); // 60
        expect(candidates[1].person.name).toBe('Sarah Saint'); // 50
    });
});
