import { describe, it, expect } from 'vitest';
import { processQuery, type CoPilotContext } from './copilot';
import type { Student } from './pco';
import type { HealthStats } from './analytics';

describe('CoPilot Logic', () => {
    // Mock Data
    const mockStudent = (id: string, name: string, grade: number | null, age: number = 10, isChild: boolean = true): Student => ({
        id, name, firstName: name.split(' ')[0], lastName: name.split(' ')[1] || '',
        birthdate: '2010-01-01', age, pcoGrade: grade, calculatedGrade: grade || 0, delta: 0,
        lastCheckInAt: null, checkInCount: 0, groupCount: 0, isChild, householdId: null,
        hasNameAnomaly: false, hasEmailAnomaly: false, hasAddressAnomaly: false, hasPhoneAnomaly: false
    });

    const mockStats: HealthStats = {
        score: 85,
        anomalies: 5,
        total: 100,
        accuracy: 95
    };

    const context: CoPilotContext = {
        students: [
            mockStudent('1', 'Alice Wonderland', 5),
            mockStudent('2', 'Bob Builder', 5),
            mockStudent('3', 'Charlie Brown', 0), // Kindergarten
            mockStudent('4', 'Ghostly Gus', null, 15, false), // Ghost candidate logic depends on isGhost util which uses lastCheckInAt
        ],
        checkIns: [],
        events: [],
        stats: mockStats
    };

    it('handles health score queries', () => {
        const result = processQuery('What is my health score?', context);
        expect(result.message).toContain('85/100');
        expect(result.data).toHaveLength(2);
    });

    it('handles grade queries', () => {
        const result = processQuery('Show me 5th grade students', context);
        expect(result.message).toContain('found 2 students');
        expect(result.data).toHaveLength(2);
        expect(result.data?.[0].primary).toBe('Alice Wonderland');
    });

    it('handles kindergarten queries', () => {
        const result = processQuery('Who is in kindergarten?', context);
        expect(result.message).toContain('found 1 students');
        expect(result.data?.[0].primary).toBe('Charlie Brown');
    });

    it('handles person search', () => {
        const result = processQuery('Find Alice', context);
        // The message reflects the query "Find Alice" -> "alice", so it says 'Here is what I found for "alice":'
        // We should check that the DATA contains the name we want, or the message confirms the search query.
        expect(result.message).toContain('alice');
        expect(result.data).toHaveLength(1);
        expect(result.data?.[0].primary).toBe('Alice Wonderland');
    });



    it('handles split household queries', () => {
        // Alice and Bob are both in the mock data without a shared householdId but without overlapping address/email/phone.
        // We expect none for the default context.
        const result = processQuery('Find split households', context);
        expect(result.message).toContain("Good news!");
    });

    it('handles missing volunteers queries', () => {
        const result = processQuery('Find missing volunteers', context);
        // It should just return no missing volunteers since context.checkIns is empty
        expect(result.message).toContain("Good news!");
    });

    it('handles automations queries', () => {
        const result = processQuery('What automations are pending?', context);
        // By default with the mock data, there are no pending automations
        expect(result.message).toContain("Good news!");

        // Let's use Vitest's fake timers to ensure absolute predictability for "today"
        // Since we can't easily do it mid-test without side effects, we will test an expired background check instead
        // which is easier to spoof without time zone edge cases.
        const automationsContext: CoPilotContext = {
            ...context,
            students: [
                {
                    ...mockStudent('99', 'Expired Adult', null, 30, false),
                    backgroundCheckExpiresAt: '2020-01-01T00:00:00Z'
                }
            ]
        };

        const result2 = processQuery('What actions are pending?', automationsContext);
        expect(result2.message).toContain("pending automations");
        expect(result2.data?.[0].primary).toBe('Expired Background Checks');
    });

    it('handles unknown queries gracefully', () => {
        const result = processQuery('What is the meaning of life?', context);
        expect(result.message).toContain("I'm not sure how to help with that");
        expect(result.message).toContain("'Automations'");
    });
});
