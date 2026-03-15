import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AutomationsReport } from './AutomationsReport';
import type { Student } from '../utils/pco';

describe('AutomationsReport', () => {
    const createStudent = (id: string, name: string, birthdate: string, pcoGrade: number | null, age: number, isChild: boolean = true, bgExpiry: string | null = null): Student => ({
        id, age, pcoGrade, name, firstName: name.split(' ')[0], lastName: name.split(' ')[1] || '',
        birthdate, calculatedGrade: 5, delta: 0, lastCheckInAt: null, checkInCount: 0, groupCount: 0,
        isChild, householdId: '1', hasNameAnomaly: false, hasEmailAnomaly: false, hasPhoneAnomaly: false, hasAddressAnomaly: false, backgroundCheckExpiresAt: bgExpiry
    });

    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders empty states when there are no actions', () => {
        vi.setSystemTime(new Date('2024-05-10'));
        render(<AutomationsReport students={[]} graderOptions={{}} />);

        expect(screen.getByText('0 Pending Actions')).toBeDefined();
        expect(screen.getByText('No upcoming birthdays to process.')).toBeDefined();
        expect(screen.getByText('No pending grade promotions.')).toBeDefined();
        expect(screen.getByText('No pending college send-offs.')).toBeDefined();
        expect(screen.getByText('No background checks expiring soon.')).toBeDefined();
        expect(screen.getByText('No expired background checks.')).toBeDefined();
    });

    it('renders birthday bot suggestions', () => {
        // Today is May 10. Birthday is May 17.
        vi.setSystemTime(new Date('2024-05-10'));
        const students = [createStudent('1', 'Birthday Boy', '2014-05-17', 4, 9)];

        render(<AutomationsReport students={students} graderOptions={{}} />);

        expect(screen.getByText('1 Pending Actions')).toBeDefined();
        expect(screen.getByText('Birthday Boy')).toBeDefined();
        expect(screen.getByText('Turning 10 in 7 days')).toBeDefined();
    });

    it('renders grade promotion suggestions', () => {
        // After June 1st (Use Oct 15 to ensure the expected grade aligns with the new school year strictly)
        vi.setSystemTime(new Date('2024-10-15'));

        // Born Jan 1, 2014 -> Age ~10 -> Expected Grade 5 in 2024 school year
        // We set pcoGrade to 4 to trigger the need for promotion.
        const students = [createStudent('1', 'Promotion Kid', '2014-01-01', 4, 10)];

        render(<AutomationsReport students={students} graderOptions={{}} />);

        expect(screen.getByText('1 Pending Actions')).toBeDefined();
        expect(screen.getByText('Promotion Kid')).toBeDefined();
        // The text is "Grade 4 → 5", let's match pieces since there's strong formatting
        expect(screen.getByText((content) => content.includes('Grade 4'))).toBeDefined();
    });

    it('renders college send-off suggestions only in August', () => {
        // August 15th
        vi.setSystemTime(new Date('2024-08-15'));
        const students = [createStudent('1', 'College Bound', '2006-01-01', 12, 18)];

        render(<AutomationsReport students={students} graderOptions={{}} />);

        expect(screen.getByText('1 Pending Actions')).toBeDefined();
        expect(screen.getByText('College Bound')).toBeDefined();
        expect(screen.getByText('Age 18 • Move to Young Adults')).toBeDefined();
    });

    it('renders expiring background checks', () => {
        // May 10th
        vi.setSystemTime(new Date('2024-05-10T00:00:00Z'));
        // Expires May 15th (5 days away)
        const students = [createStudent('1', 'Expiring Vol', '1990-01-01', null, 34, false, '2024-05-15T00:00:00Z')];

        render(<AutomationsReport students={students} graderOptions={{}} />);

        expect(screen.getByText('1 Pending Actions')).toBeDefined();
        expect(screen.getByText('Expiring Vol')).toBeDefined();
        expect(screen.getByText('Expires in 5 days')).toBeDefined();
        expect(screen.getByText('Email Reminder')).toBeDefined();
    });

    it('renders expired background checks', () => {
        // May 10th
        vi.setSystemTime(new Date('2024-05-10T00:00:00Z'));
        // Expired May 5th (-5 days)
        const students = [createStudent('1', 'Expired Vol', '1990-01-01', null, 34, false, '2024-05-05T00:00:00Z')];

        render(<AutomationsReport students={students} graderOptions={{}} />);

        expect(screen.getByText('1 Pending Actions')).toBeDefined();
        expect(screen.getByText('Expired Vol')).toBeDefined();
        expect(screen.getByText('Expired 5 days ago')).toBeDefined();
        expect(screen.getByText('Remove from Roster')).toBeDefined();
    });

    it('dismisses actions when dismiss button is clicked', () => {
        vi.setSystemTime(new Date('2024-05-10'));
        const students = [createStudent('1', 'Birthday Boy', '2014-05-17', 4, 9)];

        render(<AutomationsReport students={students} graderOptions={{}} />);

        expect(screen.queryByText('Birthday Boy')).not.toBeNull();

        // Click dismiss
        fireEvent.click(screen.getByText('Dismiss'));

        // Should be gone
        expect(screen.queryByText('Birthday Boy')).toBeNull();
        expect(screen.getByText('0 Pending Actions')).toBeDefined();
    });
});
