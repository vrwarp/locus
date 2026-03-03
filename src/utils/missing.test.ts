import { describe, it, expect } from 'vitest';
import { calculateMissingVolunteers } from './missing';
import type { Student, PcoEvent, PcoCheckIn } from './pco';
import { parseISO, subWeeks, subDays, formatISO } from 'date-fns';

describe('calculateMissingVolunteers', () => {
    const today = new Date();

    const mockStudent: Student = {
        id: '1', age: 30, pcoGrade: null, name: 'John Doe', firstName: 'John', lastName: 'Doe',
        birthdate: '1990-01-01', calculatedGrade: 0, delta: 0, lastCheckInAt: null, checkInCount: 0, groupCount: 0,
        isChild: false, householdId: '1', hasNameAnomaly: false, hasEmailAnomaly: false, hasPhoneAnomaly: false, hasAddressAnomaly: false
    };

    const mockEvent: PcoEvent = {
        id: '1', type: 'Event', attributes: { name: 'Sunday Worship Service' } // Service
    };
    const mockVolunteerEvent: PcoEvent = {
        id: '2', type: 'Event', attributes: { name: 'Kids Team' } // Serving
    };

    const createCheckIn = (date: Date, eventId: string, kind: 'Regular' | 'Volunteer' = 'Regular'): PcoCheckIn => ({
        id: Math.random().toString(),
        type: 'CheckIn',
        attributes: { created_at: formatISO(date), kind },
        relationships: {
            person: { data: { id: mockStudent.id, type: 'Person' } },
            event: { data: { id: eventId, type: 'Event' } }
        }
    });

    it('should identify a key volunteer who missed 2 weeks', () => {
        // History: Served 3 weeks ago and 4 weeks ago
        const checkIns = [
            { ...createCheckIn(today, mockEvent.id, 'Regular'), relationships: { person: { data: { id: 'other', type: 'Person' } }, event: { data: { id: mockEvent.id, type: 'Event' } } } },

            createCheckIn(subWeeks(today, 3), mockVolunteerEvent.id, 'Volunteer'),
            createCheckIn(subWeeks(today, 4), mockVolunteerEvent.id, 'Volunteer')
        ];
        // Now checkIns has no events in the last 2 weeks

        const missing = calculateMissingVolunteers(checkIns, [mockEvent, mockVolunteerEvent], [mockStudent]);
        expect(missing).toHaveLength(1);
        expect(missing[0].person.name).toBe('John Doe');
        expect(missing[0].missingWeeks).toBe(3); // Last seen 3 weeks ago
    });

    it('should NOT identify a key volunteer who was seen recently', () => {
        // History: Served 3 weeks ago, 4 weeks ago, AND 1 week ago
        const checkIns = [
            createCheckIn(subWeeks(today, 1), mockVolunteerEvent.id, 'Volunteer'),
            createCheckIn(subWeeks(today, 3), mockVolunteerEvent.id, 'Volunteer'),
            createCheckIn(subWeeks(today, 4), mockVolunteerEvent.id, 'Volunteer')
        ];

        const missing = calculateMissingVolunteers(checkIns, [mockEvent, mockVolunteerEvent], [mockStudent]);
        expect(missing).toHaveLength(0); // Recent activity means not missing
    });

    it('should NOT identify someone who is not a key volunteer', () => {
        // History: Served only once 4 weeks ago
        const checkIns = [
             createCheckIn(subWeeks(today, 4), mockVolunteerEvent.id, 'Volunteer')
        ];

        const missing = calculateMissingVolunteers(checkIns, [mockEvent, mockVolunteerEvent], [mockStudent]);
        expect(missing).toHaveLength(0); // Only served 1 time, not a key volunteer
    });
});
