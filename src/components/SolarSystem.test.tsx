import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SolarSystem } from './SolarSystem';
import type { Student } from '../utils/pco';

describe('SolarSystem Component', () => {
    it('renders empty state when no families with parents and children exist', () => {
        const students: Student[] = [
            {
                id: '1', name: 'John Doe', firstName: 'John', lastName: 'Doe',
                age: 30, isChild: false, householdId: 'h1', pcoGrade: null,
                calculatedGrade: 0, delta: 0, lastCheckInAt: null, checkInCount: 0,
                groupCount: 0, hasNameAnomaly: false
            }
        ];

        render(<SolarSystem students={students} />);

        expect(screen.getByText('No complete family structures (parents + children) found to visualize.')).toBeInTheDocument();
    });

    it('groups parents and children by householdId and renders the galaxy view', () => {
        const students: Student[] = [
            {
                id: '1', name: 'John Smith', firstName: 'John', lastName: 'Smith',
                age: 40, isChild: false, householdId: 'h1', pcoGrade: null,
                calculatedGrade: 0, delta: 0, lastCheckInAt: null, checkInCount: 0,
                groupCount: 0, hasNameAnomaly: false
            },
            {
                id: '2', name: 'Jane Smith', firstName: 'Jane', lastName: 'Smith',
                age: 38, isChild: false, householdId: 'h1', pcoGrade: null,
                calculatedGrade: 0, delta: 0, lastCheckInAt: null, checkInCount: 0,
                groupCount: 0, hasNameAnomaly: false
            },
            {
                id: '3', name: 'Timmy Smith', firstName: 'Timmy', lastName: 'Smith',
                age: 10, isChild: true, householdId: 'h1', pcoGrade: null,
                calculatedGrade: 4, delta: 0, lastCheckInAt: null, checkInCount: 0,
                groupCount: 0, hasNameAnomaly: false
            }
        ];

        render(<SolarSystem students={students} />);

        expect(screen.getByText('The Galaxy')).toBeInTheDocument();
        expect(screen.getByText('Smith')).toBeInTheDocument();
        expect(screen.getByText('2 Stars')).toBeInTheDocument();
        expect(screen.getByText('1 Planets')).toBeInTheDocument();
    });

    it('navigates to the system view when a family is clicked', () => {
        const students: Student[] = [
            {
                id: '1', name: 'John Smith', firstName: 'John', lastName: 'Smith',
                age: 40, isChild: false, householdId: 'h1', pcoGrade: null,
                calculatedGrade: 0, delta: 0, lastCheckInAt: null, checkInCount: 0,
                groupCount: 0, hasNameAnomaly: false
            },
            {
                id: '3', name: 'Timmy Smith', firstName: 'Timmy', lastName: 'Smith',
                age: 10, isChild: true, householdId: 'h1', pcoGrade: null,
                calculatedGrade: 4, delta: 0, lastCheckInAt: null, checkInCount: 0,
                groupCount: 0, hasNameAnomaly: false
            }
        ];

        render(<SolarSystem students={students} />);

        // Click on the Smith family card
        fireEvent.click(screen.getByText('Smith'));

        // Should now be in system view
        expect(screen.getByText('The Smith System')).toBeInTheDocument();
        expect(screen.getByText(/Parents: John Smith \(40\)/)).toBeInTheDocument();

        // Check for Sun (Parent)
        expect(screen.getByText('John')).toBeInTheDocument();

        // Check for Planet (Child)
        expect(screen.getByText('Timmy (10)')).toBeInTheDocument();

        // Can go back to galaxy
        fireEvent.click(screen.getByText('← Back to Galaxy'));
        expect(screen.getByText('The Galaxy')).toBeInTheDocument();
    });
});
