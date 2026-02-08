import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReviewMode } from './ReviewMode';
import { describe, it, expect, vi } from 'vitest';
import type { Student } from '../utils/pco';

const mockStudent: Student = {
    id: '1',
    name: 'Test Student',
    birthdate: '2015-01-01',
    pcoGrade: 4,
    calculatedGrade: 5,
    delta: 1,
    age: 9,
    lastCheckInAt: null,
    checkInCount: 0,
    groupCount: 0
};

const mockStudents: Student[] = [
    mockStudent,
    { ...mockStudent, id: '2', name: 'Second Student', pcoGrade: 2, calculatedGrade: 3 }
];

describe('ReviewMode', () => {
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
        fireEvent.click(screen.getByText('Fix Grade to 5'));

        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
            id: '1',
            pcoGrade: 5,
            delta: 0 // New delta
        }));

        expect(screen.getByText('Second Student')).toBeInTheDocument();
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
});
