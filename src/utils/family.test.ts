import { describe, it, expect } from 'vitest';
import { analyzeFamilies } from './family';
import type { Student } from './pco';
import type { Address } from './hygiene';

const mockAddress = (street: string): Address => ({
    street,
    city: 'City',
    state: 'ST',
    zip: '12345',
    location: 'Home'
});

const mockStudent = (id: string, name: string, age: number, isChild: boolean, householdId: string, address?: Address, email?: string, phoneNumber?: string): Student => ({
    id,
    name,
    firstName: name,
    lastName: 'Doe',
    age,
    isChild,
    householdId,
    pcoGrade: 0,
    birthdate: '2000-01-01',
    calculatedGrade: 0,
    delta: 0,
    lastCheckInAt: null,
    checkInCount: 0,
    groupCount: 0,
    hasNameAnomaly: false,
    hasEmailAnomaly: false,
    hasAddressAnomaly: false,
    hasPhoneAnomaly: false,
    address,
    email,
    phoneNumber
});

describe('analyzeFamilies', () => {
    it('should identify critical issue when child is older than parent', () => {
        const students = [
            mockStudent('1', 'Dad', 10, false, 'h1'),
            mockStudent('2', 'Son', 40, true, 'h1')
        ];

        const issues = analyzeFamilies(students);
        expect(issues).toHaveLength(1);
        expect(issues[0].type).toBe('Critical');
        expect(issues[0].message).toContain('is older than Parent');
    });

    it('should identify warning when age gap is small', () => {
        const students = [
            mockStudent('1', 'Mom', 20, false, 'h2'),
            mockStudent('2', 'Daughter', 10, true, 'h2') // 10 year gap
        ];

        const issues = analyzeFamilies(students);
        expect(issues).toHaveLength(1);
        expect(issues[0].type).toBe('Warning');
        expect(issues[0].message).toContain('Small age gap');
    });

    it('should report no issues for normal families', () => {
        const students = [
            mockStudent('1', 'Dad', 40, false, 'h3'),
            mockStudent('2', 'Mom', 38, false, 'h3'),
            mockStudent('3', 'Son', 10, true, 'h3')
        ];

        const issues = analyzeFamilies(students);
        expect(issues).toHaveLength(0);
    });

    it('should identify critical issue for large spouse gap', () => {
        const students = [
            mockStudent('1', 'Dad', 80, false, 'h4'),
            mockStudent('2', 'Mom', 30, false, 'h4') // 50 year gap
        ];

        const issues = analyzeFamilies(students);
        expect(issues).toHaveLength(1);
        expect(issues[0].type).toBe('Critical');
        expect(issues[0].message).toContain('Large age gap');
    });

    it('should identify potential split household by address', () => {
        const addr = mockAddress('123 Main St');
        const students = [
            // Household 1: Parents
            mockStudent('1', 'Dad', 40, false, 'h5', addr),
            mockStudent('2', 'Mom', 38, false, 'h5', addr),
            // Household 2: Kids
            mockStudent('3', 'Son', 10, true, 'h6', addr),
            mockStudent('4', 'Daughter', 8, true, 'h6', addr)
        ];

        const issues = analyzeFamilies(students);
        expect(issues).toHaveLength(1); // 1 Split Household warning (Address)
        expect(issues[0].type).toBe('Warning');
        expect(issues[0].message).toContain('Potential Split Household');
        expect(issues[0].message).toContain('Address');
        expect(issues[0].householdId).toContain('h5');
        expect(issues[0].householdId).toContain('h6');
    });

    it('should identify potential split household by email', () => {
        const email = 'family@example.com';
        const students = [
            mockStudent('1', 'Dad', 40, false, 'h7', undefined, email),
            mockStudent('3', 'Son', 10, true, 'h8', undefined, email)
        ];

        const issues = analyzeFamilies(students);
        expect(issues).toHaveLength(1);
        expect(issues[0].message).toContain('Email');
    });

    it('should identify potential split household by phone', () => {
        const phone = '555-123-4567';
        const students = [
            mockStudent('1', 'Dad', 40, false, 'h9', undefined, undefined, phone),
            mockStudent('3', 'Son', 10, true, 'h10', undefined, undefined, phone)
        ];

        const issues = analyzeFamilies(students);
        expect(issues).toHaveLength(1);
        expect(issues[0].message).toContain('Phone');
    });
});
