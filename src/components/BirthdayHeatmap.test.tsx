import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BirthdayHeatmap } from './BirthdayHeatmap';
import type { Student } from '../utils/pco';

const mockStudent = (birthdate: string): Student => ({
    id: '1',
    age: 10,
    pcoGrade: 5,
    name: 'Test Student',
    firstName: 'Test',
    lastName: 'Student',
    birthdate: birthdate,
    calculatedGrade: 5,
    delta: 0,
    lastCheckInAt: null,
    checkInCount: 0,
    groupCount: 0,
    isChild: true,
    householdId: '1',
    hasNameAnomaly: false,
    hasEmailAnomaly: false,
    hasAddressAnomaly: false,
    hasPhoneAnomaly: false
});

describe('BirthdayHeatmap', () => {
    it('renders the header and grid', () => {
        render(<BirthdayHeatmap students={[]} />);
        expect(screen.getByText('The Heatmap of Life: Birthdays')).toBeInTheDocument();
        expect(screen.getByText('Jan')).toBeInTheDocument();
        expect(screen.getByText('Dec')).toBeInTheDocument();
        expect(screen.getByText('31')).toBeInTheDocument(); // Day label
    });

    it('renders cells with counts', () => {
        const students = [
            mockStudent('2010-01-01'),
            mockStudent('2015-01-01'), // 2 on Jan 1
            mockStudent('2012-02-29')  // 1 on Feb 29
        ];
        render(<BirthdayHeatmap students={students} />);

        // Jan 1 should have 2 birthdays
        const jan1 = screen.getByLabelText('Jan 1: 2 birthdays');
        expect(jan1).toBeInTheDocument();

        // Feb 29 should have 1 birthday
        const feb29 = screen.getByLabelText('Feb 29: 1 birthdays');
        expect(feb29).toBeInTheDocument();
    });
});
