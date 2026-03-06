import { describe, it, expect } from 'vitest';
import { detectDuplicates } from './duplicates';
import type { Student } from './pco';

describe('detectDuplicates', () => {
    const createMockStudent = (id: string, name: string, email?: string, phone?: string): Student => ({
        id,
        name,
        firstName: name.split(' ')[0],
        lastName: name.split(' ')[1] || '',
        age: 30,
        pcoGrade: null,
        birthdate: '1990-01-01',
        calculatedGrade: 0,
        delta: 0,
        lastCheckInAt: null,
        checkInCount: 0,
        groupCount: 0,
        isChild: false,
        householdId: '1',
        hasNameAnomaly: false,
        email,
        phoneNumber: phone,
        hasEmailAnomaly: false,
        hasAddressAnomaly: false,
        hasPhoneAnomaly: false,
    });

    it('should identify duplicates by exact Name and Email match', () => {
        const students = [
            createMockStudent('1', 'John Doe', 'john.doe@example.com'),
            createMockStudent('2', 'John Doe', 'john.doe@example.com'),
            createMockStudent('3', 'Jane Doe', 'jane.doe@example.com'),
        ];

        const duplicates = detectDuplicates(students);
        expect(duplicates).toHaveLength(1);
        expect(duplicates[0].criteria).toBe('Name & Email Match');
        expect(duplicates[0].students).toHaveLength(2);
        expect(duplicates[0].students.map(s => s.id)).toContain('1');
        expect(duplicates[0].students.map(s => s.id)).toContain('2');
    });

    it('should identify duplicates by exact Name and Phone match', () => {
        const students = [
            createMockStudent('1', 'Alice Smith', undefined, '555-123-4567'),
            createMockStudent('2', 'Alice Smith', undefined, '5551234567'), // Different format but same digits
            createMockStudent('3', 'Bob Smith', undefined, '555-987-6543'),
        ];

        const duplicates = detectDuplicates(students);
        expect(duplicates).toHaveLength(1);
        expect(duplicates[0].criteria).toBe('Name & Phone Match');
        expect(duplicates[0].students).toHaveLength(2);
        expect(duplicates[0].students.map(s => s.id)).toContain('1');
        expect(duplicates[0].students.map(s => s.id)).toContain('2');
    });

    it('should NOT group people with same name but different contact info', () => {
        const students = [
            createMockStudent('1', 'John Doe', 'john1@example.com', '555-111-1111'),
            createMockStudent('2', 'John Doe', 'john2@example.com', '555-222-2222'),
        ];

        const duplicates = detectDuplicates(students);
        expect(duplicates).toHaveLength(0);
    });

    it('should not return duplicate groups twice if they match both Name/Email and Name/Phone', () => {
        const students = [
            createMockStudent('1', 'Tom Hanks', 'tom@example.com', '555-333-3333'),
            createMockStudent('2', 'Tom Hanks', 'tom@example.com', '555-333-3333'),
        ];

        const duplicates = detectDuplicates(students);
        expect(duplicates).toHaveLength(1); // They should be in one group, not two separate ones
        expect(duplicates[0].students).toHaveLength(2);
    });

    it('should identify duplicates by exact name and exact address (even without matching contact info)', () => {
        const student1 = createMockStudent('1', 'James Taylor');
        student1.address = { street: '789 Pine St', zip: '98765', city: 'City', state: 'ST' };
        const student2 = createMockStudent('2', 'James Taylor');
        student2.address = { street: '789 Pine St', zip: '98765', city: 'City', state: 'ST' };

        const students = [student1, student2];

        const duplicates = detectDuplicates(students);
        expect(duplicates).toHaveLength(1);
        expect(duplicates[0].criteria).toBe('Same Name & Address');
        expect(duplicates[0].students).toHaveLength(2);
    });

    it('should prevent false positive fuzzy duplicates for siblings with short names (e.g., Ava vs Mia)', () => {
        const student1 = createMockStudent('1', 'Ava Garcia');
        student1.address = { street: '111 Birch Rd', zip: '55555', city: 'City', state: 'ST' };
        const student2 = createMockStudent('2', 'Mia Garcia'); // Levenshtein dist is 2, but they are siblings
        student2.address = { street: '111 Birch Rd', zip: '55555', city: 'City', state: 'ST' };

        const students = [student1, student2];

        const duplicates = detectDuplicates(students);
        expect(duplicates).toHaveLength(0); // Should not group them
    });

    it('should prevent false positive fuzzy duplicates for siblings with short names (e.g., Emma vs Mia)', () => {
        const student1 = createMockStudent('1', 'Emma Garcia');
        student1.address = { street: '111 Birch Rd', zip: '55555', city: 'City', state: 'ST' };
        const student2 = createMockStudent('2', 'Mia Garcia'); // Levenshtein dist is 2, but they are siblings
        student2.address = { street: '111 Birch Rd', zip: '55555', city: 'City', state: 'ST' };

        const students = [student1, student2];

        const duplicates = detectDuplicates(students);
        expect(duplicates).toHaveLength(0); // Should not group them
    });

    it('should identify fuzzy duplicates by similar name and exact address', () => {
        const student1 = createMockStudent('1', 'Jonathan Doe');
        student1.address = { street: '123 Main St', zip: '12345', city: 'City', state: 'ST' };
        const student2 = createMockStudent('2', 'Jonathon Doe'); // Levenshtein dist 1
        student2.address = { street: '123 Main St', zip: '12345', city: 'City', state: 'ST' };
        const student3 = createMockStudent('3', 'Jane Doe'); // Too different
        student3.address = { street: '123 Main St', zip: '12345', city: 'City', state: 'ST' };

        const students = [student1, student2, student3];

        const duplicates = detectDuplicates(students);
        expect(duplicates).toHaveLength(1);
        expect(duplicates[0].criteria).toBe('Similar Name & Same Address');
        expect(duplicates[0].students).toHaveLength(2);
        expect(duplicates[0].students.map(s => s.id)).toContain('1');
        expect(duplicates[0].students.map(s => s.id)).toContain('2');
    });

    it('should not identify fuzzy duplicates if address does not match', () => {
        const student1 = createMockStudent('1', 'Jonathan Doe');
        student1.address = { street: '123 Main St', zip: '12345', city: 'City', state: 'ST' };
        const student2 = createMockStudent('2', 'Jonathon Doe'); // Levenshtein dist 1
        student2.address = { street: '456 Oak St', zip: '12345', city: 'City', state: 'ST' }; // Different street

        const students = [student1, student2];

        const duplicates = detectDuplicates(students);
        expect(duplicates).toHaveLength(0);
    });
});
