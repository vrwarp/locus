import { describe, it, expect } from 'vitest';
import { calculateRecruitmentCandidates, generateAskScript } from './recruitment';
import type { Student, PcoCheckIn, PcoEvent } from './pco';
import { formatISO, subWeeks, subMonths } from 'date-fns';

describe('Recruitment Logic', () => {
    // Helpers
    const createPerson = (id: string, name: string, isChild: boolean, householdId: string | null = null, age: number = 30): Student => ({
        id,
        name,
        firstName: name.split(' ')[0],
        lastName: name.split(' ')[1] || '',
        birthdate: '1990-01-01', // Dummy
        age, // Use passed age
        pcoGrade: isChild ? 5 : null,
        calculatedGrade: 5,
        delta: 0,
        lastCheckInAt: null,
        checkInCount: null,
        groupCount: null,
        avatarUrl: undefined,
        isChild,
        householdId,
        hasNameAnomaly: false,
        email: undefined,
        address: undefined,
        phoneNumber: undefined,
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
        // Score: 5 * 10 = 50. Tenure < 6mo (only 5 weeks).
        expect(candidates[0].score).toBe(50);
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
            createPerson('3', 'Timmy Tiny', true, null, 10),
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

    it('boosts score for parents and identifies potential roles', () => {
        const people = [
            createPerson('4', 'Papa Bear', false, 'household_A', 40),
            createPerson('5', 'Baby Bear', true, 'household_A', 5), // 5yo -> Kids Ministry
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
        const papa = candidates[0];
        expect(papa.person.name).toBe('Papa Bear');
        expect(papa.isParent).toBe(true);
        // Score: (4 * 10) + 20 (Parent) = 60. Tenure < 6mo.
        expect(papa.score).toBe(60);
        expect(papa.childNames).toContain('Baby');
        expect(papa.potentialRoles).toContain('Kids Ministry');
    });

    it('calculates tenure correctly and boosts score', () => {
        const people = [
            createPerson('6', 'Old Faithful', false),
        ];
        const events = [
            createEvent('100', 'Sunday Worship'),
        ];
        const checkIns: PcoCheckIn[] = [];

        // Recent check-ins (4 in last 8 weeks)
        for(let i=0; i<4; i++) {
            checkIns.push(createCheckIn(`c${i}`, '6', '100', i));
        }

        // Old check-in (10 months ago)
        // Note: createCheckIn uses subWeeks. 10 months approx 43 weeks.
        const oldCheckIn: PcoCheckIn = {
            id: 'old_1',
            type: 'CheckIn',
            attributes: {
                created_at: formatISO(subMonths(new Date(), 10)),
                kind: 'Regular'
            },
            relationships: {
                person: { data: { type: 'Person', id: '6' } },
                event: { data: { type: 'Event', id: '100' } }
            }
        };
        checkIns.push(oldCheckIn);

        const candidates = calculateRecruitmentCandidates(checkIns, events, people);

        expect(candidates).toHaveLength(1);
        const faithful = candidates[0];
        expect(faithful.tenureMonths).toBeGreaterThanOrEqual(9); // Allow some fuzziness with date math
        // Score: (4 * 10) + 10 (Tenure) = 50.
        expect(faithful.score).toBe(50);
    });

    it('generates personalized ask script for parent', () => {
        const candidate = {
            person: createPerson('4', 'Papa Bear', false),
            worshipCount: 4,
            servingCount: 0,
            score: 60,
            isParent: true,
            tenureMonths: 2,
            potentialRoles: ['Kids Ministry'],
            childNames: ['Baby']
        };

        const script = generateAskScript(candidate);
        expect(script).toContain('Hi Papa,');
        expect(script).toContain('We love having Baby in our ministry areas');
        expect(script).toContain("Kids Ministry");
    });

    it('generates personalized ask script for long-term attender', () => {
        const candidate = {
            person: createPerson('6', 'Old Faithful', false),
            worshipCount: 4,
            servingCount: 0,
            score: 50,
            isParent: false,
            tenureMonths: 12, // > 6
            potentialRoles: [],
            childNames: []
        };

        const script = generateAskScript(candidate);
        expect(script).toContain('Hi Old,');
        expect(script).toContain('consistent part of our church family for over 12 months');
    });
});
