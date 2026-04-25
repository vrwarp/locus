import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LifeEventsHeatmap } from './LifeEventsHeatmap';
import type { Student } from '../utils/pco';

const mockStudent = (birthdate: string, anniversary?: string, deathDate?: string): Student => ({
    id: '1',
    age: 10,
    pcoGrade: 5,
    name: 'Test Student',
    firstName: 'Test',
    lastName: 'Student',
    birthdate: birthdate,
    anniversary: anniversary || null,
    deathDate: deathDate || null,
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

describe('LifeEventsHeatmap', () => {
    it('renders the header and grid', () => {
        render(<LifeEventsHeatmap students={[]} />);
        expect(screen.getByText('The Heatmap of Life: Birthdays')).toBeInTheDocument();
        expect(screen.getByText('Jan')).toBeInTheDocument();
        expect(screen.getByText('Dec')).toBeInTheDocument();
        expect(screen.getByText('31')).toBeInTheDocument(); // Day label
    });

    it('renders cells with counts for birthdays', () => {
        const students = [
            mockStudent('2010-01-01'),
            mockStudent('2015-01-01'), // 2 on Jan 1
            mockStudent('2012-02-29')  // 1 on Feb 29
        ];
        render(<LifeEventsHeatmap students={students} />);

        // Jan 1 should have 2 birthdays
        const jan1 = screen.getByLabelText('Jan 1: 2 birthdays');
        expect(jan1).toBeInTheDocument();

        // Feb 29 should have 1 birthday
        const feb29 = screen.getByLabelText('Feb 29: 1 birthdays');
        expect(feb29).toBeInTheDocument();
    });

    it('can switch to anniversaries and display counts', () => {
         const students = [
            mockStudent('2010-01-01', '2020-05-15'),
            mockStudent('2015-01-01', '2020-05-15'),
        ];
        render(<LifeEventsHeatmap students={students} />);

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'anniversaries' } });

        expect(screen.getByText('The Heatmap of Life: Anniversaries')).toBeInTheDocument();

        const may15 = screen.getByLabelText('May 15: 2 anniversaries');
        expect(may15).toBeInTheDocument();
    });

    it('can switch to deaths and display counts', () => {
         const students = [
            mockStudent('2010-01-01', undefined, '2021-11-01'),
        ];
        render(<LifeEventsHeatmap students={students} />);

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'deaths' } });

        expect(screen.getByText('The Heatmap of Life: Deaths')).toBeInTheDocument();

        const nov1 = screen.getByLabelText('Nov 1: 1 deaths');
        expect(nov1).toBeInTheDocument();
    });
});
