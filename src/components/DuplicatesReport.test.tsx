import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { DuplicatesReport } from './DuplicatesReport';
import type { Student } from '../utils/pco';
import '@testing-library/jest-dom';

describe('DuplicatesReport', () => {
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

    it('renders empty state when there are no duplicates', () => {
        const students = [
            createMockStudent('1', 'Alice', 'alice@example.com'),
            createMockStudent('2', 'Bob', 'bob@example.com'),
        ];
        render(<DuplicatesReport students={students} />);

        expect(screen.getByText('No duplicate records found.')).toBeInTheDocument();
        expect(screen.getByText('Your database is sparkling clean.')).toBeInTheDocument();
    });

    it('renders duplicate groups correctly', () => {
        const students = [
            createMockStudent('1', 'John Doe', 'john@example.com'),
            createMockStudent('2', 'John Doe', 'john@example.com'),
            createMockStudent('3', 'Jane Doe', undefined, '555-123-4567'),
            createMockStudent('4', 'Jane Doe', undefined, '5551234567'),
        ];

        render(<DuplicatesReport students={students} />);

        // Should not show empty state
        expect(screen.queryByText('No duplicate records found.')).not.toBeInTheDocument();

        // Should show summary
        expect(screen.getByText('Found 2 potential duplicate groups based on matching names and contact information.')).toBeInTheDocument();

        // Should show criteria badges
        expect(screen.getByText('Name & Email Match')).toBeInTheDocument();
        expect(screen.getByText('Name & Phone Match')).toBeInTheDocument();

        // Should show student IDs for exact match confirmation
        expect(screen.getByText('(ID: 1)')).toBeInTheDocument();
        expect(screen.getByText('(ID: 2)')).toBeInTheDocument();
        expect(screen.getByText('(ID: 3)')).toBeInTheDocument();
        expect(screen.getByText('(ID: 4)')).toBeInTheDocument();

        // Should show emails and phones
        expect(screen.getAllByText('📧 john@example.com')).toHaveLength(2);
        expect(screen.getByText('📱 555-123-4567')).toBeInTheDocument();
        expect(screen.getByText('📱 5551234567')).toBeInTheDocument();
    });
});
