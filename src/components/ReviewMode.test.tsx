import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewMode } from './ReviewMode';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Student } from '../utils/pco';
import * as audioUtils from '../utils/audio';

// Mock audio utils
vi.mock('../utils/audio', () => ({
    playTone: vi.fn(),
}));

const mockStudent: Student = {
    id: '1',
    name: 'Test Student',
    firstName: 'Test',
    lastName: 'Student',
    birthdate: '2015-01-01',
    pcoGrade: 4,
    calculatedGrade: 5,
    delta: 1,
    age: 9,
    lastCheckInAt: null,
    checkInCount: 0,
    groupCount: 0,
    isChild: true,
    householdId: 'h1',
    hasNameAnomaly: false,
    hasEmailAnomaly: false,
    hasAddressAnomaly: false
};

const mockStudents: Student[] = [
    mockStudent,
    { ...mockStudent, id: '2', name: 'Second Student', pcoGrade: 2, calculatedGrade: 3 }
];

describe('ReviewMode', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders the first student', () => {
        render(
            <ReviewMode
                isOpen={true}
                students={mockStudents}
                onClose={vi.fn()}
                onSave={vi.fn()}
            />
        );

        expect(screen.getByText('Test Student')).toBeInTheDocument();
        expect(screen.getByText('Review Anomalies')).toBeInTheDocument();
        expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });

    it('advances to next student on Skip', () => {
        render(
            <ReviewMode
                isOpen={true}
                students={mockStudents}
                onClose={vi.fn()}
                onSave={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText('Skip'));

        expect(screen.getByText('Second Student')).toBeInTheDocument();
        expect(screen.getByText('2 / 2')).toBeInTheDocument();
    });

    it('calls onClose when skipping the last student', () => {
        const onClose = vi.fn();
        render(
            <ReviewMode
                isOpen={true}
                students={[mockStudent]}
                onClose={onClose}
                onSave={vi.fn()}
            />
        );

        fireEvent.click(screen.getByText('Skip'));
        expect(onClose).toHaveBeenCalled();
    });

    it('calls onSave and advances on Fix', () => {
        const onSave = vi.fn();
        render(
            <ReviewMode
                isOpen={true}
                students={mockStudents}
                onClose={vi.fn()}
                onSave={onSave}
            />
        );

        // Default mode is grade, default selected grade is calculatedGrade (5)
        const fixButtons = screen.getAllByText('Fix Grade');
        const fixButton = fixButtons.find(btn => btn.classList.contains('btn-fix'));
        if (!fixButton) throw new Error('Fix button not found');

        fireEvent.click(fixButton);

        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
            id: '1',
            pcoGrade: 5,
            delta: 0 // New delta
        }));

        // Verify success sound
        expect(audioUtils.playTone).toHaveBeenCalledWith(523.25, 'sine', 0.2);

        expect(screen.getByText('Second Student')).toBeInTheDocument();
    });

    it('does NOT play sound if muted', () => {
        const onSave = vi.fn();
        render(
            <ReviewMode
                isOpen={true}
                students={mockStudents}
                onClose={vi.fn()}
                onSave={onSave}
                muteSounds={true}
            />
        );

        const fixButtons = screen.getAllByText('Fix Grade');
        const fixButton = fixButtons.find(btn => btn.classList.contains('btn-fix'));
        if (!fixButton) throw new Error('Fix button not found');

        fireEvent.click(fixButton);

        expect(onSave).toHaveBeenCalled();
        expect(audioUtils.playTone).not.toHaveBeenCalled();
    });

    it('allows fixing birthdate', () => {
        const onSave = vi.fn();
        render(
            <ReviewMode
                isOpen={true}
                students={mockStudents}
                onClose={vi.fn()}
                onSave={onSave}
            />
        );

        fireEvent.click(screen.getByText('Fix Birthdate')); // Switch mode

        // Input new birthdate
        fireEvent.change(screen.getByLabelText('New Birthdate:'), { target: { value: '2016-01-01' } });

        // Find the fix button specifically
        const buttons = screen.getAllByText('Fix Birthdate');
        const fixButton = buttons.find(btn => btn.classList.contains('btn-fix'));
        if (!fixButton) throw new Error('Fix button not found');

        fireEvent.click(fixButton);

        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
            id: '1',
            birthdate: '2016-01-01'
        }));
    });

    it('allows fixing name anomalies', () => {
        const studentWithNameAnomaly: Student = {
            ...mockStudent,
            name: 'JOHN DOE',
            hasNameAnomaly: true
        };
        const onSave = vi.fn();
        render(
            <ReviewMode
                isOpen={true}
                students={[studentWithNameAnomaly]}
                onClose={vi.fn()}
                onSave={onSave}
            />
        );

        // Should default to Name mode. The button with 'active' class
        const nameModeButton = screen.getAllByText('Fix Name').find(btn => btn.classList.contains('active'));
        expect(nameModeButton).toBeInTheDocument();

        expect(screen.getByLabelText('Suggested Name:')).toHaveValue('John Doe');

        // Allow editing
        fireEvent.change(screen.getByLabelText('Suggested Name:'), { target: { value: 'John P. Doe' } });

        // Find the fix button
        const fixButton = screen.getAllByText('Fix Name').find(btn => btn.classList.contains('btn-fix'));
        if (!fixButton) throw new Error('Fix button not found');

        fireEvent.click(fixButton);

        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
            id: '1',
            name: 'John P. Doe',
            firstName: 'John',
            lastName: 'P. Doe',
            hasNameAnomaly: false
        }));
    });

    it('allows fixing email anomalies', () => {
        const studentWithEmailAnomaly: Student = {
            ...mockStudent,
            email: 'bademail',
            hasEmailAnomaly: true
        };
        const onSave = vi.fn();
        render(
            <ReviewMode
                isOpen={true}
                students={[studentWithEmailAnomaly]}
                onClose={vi.fn()}
                onSave={onSave}
            />
        );

        // Should default to Email mode
        const emailModeButton = screen.getAllByText('Fix Email').find(btn => btn.classList.contains('active'));
        expect(emailModeButton).toBeInTheDocument();

        expect(screen.getByLabelText('Correct Email:')).toHaveValue('bademail');

        // Allow editing
        fireEvent.change(screen.getByLabelText('Correct Email:'), { target: { value: 'good@email.com' } });

        // Find the fix button
        const fixButton = screen.getAllByText('Fix Email').find(btn => btn.classList.contains('btn-fix'));
        if (!fixButton) throw new Error('Fix button not found');

        fireEvent.click(fixButton);

        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
            id: '1',
            email: 'good@email.com',
            hasEmailAnomaly: false
        }));
    });

    it('allows fixing address anomalies', () => {
        const studentWithAddressAnomaly: Student = {
            ...mockStudent,
            address: { street: '123 Main', city: 'City', state: 'CA', zip: '123' },
            hasAddressAnomaly: true
        };
        const onSave = vi.fn();
        render(
            <ReviewMode
                isOpen={true}
                students={[studentWithAddressAnomaly]}
                onClose={vi.fn()}
                onSave={onSave}
            />
        );

        // Should default to Address mode
        const addressModeButton = screen.getAllByText('Fix Address').find(btn => btn.classList.contains('active'));
        expect(addressModeButton).toBeInTheDocument();

        expect(screen.getByLabelText('Zip:')).toHaveValue('123');

        // Allow editing
        fireEvent.change(screen.getByLabelText('Zip:'), { target: { value: '90210' } });

        // Find the fix button
        const fixButton = screen.getAllByText('Fix Address').find(btn => btn.classList.contains('btn-fix'));
        if (!fixButton) throw new Error('Fix button not found');

        fireEvent.click(fixButton);

        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
            id: '1',
            address: expect.objectContaining({ zip: '90210' }),
            hasAddressAnomaly: false
        }));
    });
});
