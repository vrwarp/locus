import { render, screen, fireEvent, act } from '@testing-library/react';
import { ReviewMode } from './ReviewMode';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    hasAddressAnomaly: false,
        hasPhoneAnomaly: false
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
            address: { street: '123 Main St.', city: 'City', state: 'CA', zip: '123' },
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

        // Should auto-suggest fixed street
        expect(screen.getByLabelText('Street:')).toHaveValue('123 Main Street');

        expect(screen.getByLabelText('Zip:')).toHaveValue('123');

        // Allow editing
        fireEvent.change(screen.getByLabelText('Zip:'), { target: { value: '90210' } });

        // Find the fix button
        const fixButton = screen.getAllByText('Fix Address').find(btn => btn.classList.contains('btn-fix'));
        if (!fixButton) throw new Error('Fix button not found');

        fireEvent.click(fixButton);

        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
            id: '1',
            address: expect.objectContaining({ street: '123 Main Street', zip: '90210' }),
            hasAddressAnomaly: false,
        hasPhoneAnomaly: false
        }));
    });

    it('allows fixing phone anomalies', () => {
        const studentWithPhoneAnomaly: Student = {
            ...mockStudent,
            phoneNumber: '555-1234',
            hasPhoneAnomaly: true
        };
        const onSave = vi.fn();
        render(
            <ReviewMode
                isOpen={true}
                students={[studentWithPhoneAnomaly]}
                onClose={vi.fn()}
                onSave={onSave}
            />
        );

        // Should default to Phone mode
        const phoneModeButton = screen.getAllByText('Fix Phone').find(btn => btn.classList.contains('active'));
        expect(phoneModeButton).toBeInTheDocument();

        expect(screen.getByLabelText('Suggested Phone (E.164):')).toHaveValue('555-1234'); // fixPhone won't change 7 digits

        // Allow editing
        fireEvent.change(screen.getByLabelText('Suggested Phone (E.164):'), { target: { value: '+15551234567' } });

        // Find the fix button
        const fixButton = screen.getAllByText('Fix Phone').find(btn => btn.classList.contains('btn-fix'));
        if (!fixButton) throw new Error('Fix button not found');

        fireEvent.click(fixButton);

        expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
            id: '1',
            phoneNumber: '+15551234567',
            hasPhoneAnomaly: false
        }));
    });

    describe('Speed Run Mode', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('displays timer and score when in Speed Run mode', () => {
            render(
                <ReviewMode
                    isOpen={true}
                    students={mockStudents}
                    onClose={vi.fn()}
                    onSave={vi.fn()}
                    isSpeedRun={true}
                />
            );

            expect(screen.getByText(/Speed Run ⏱️ 60s/)).toBeInTheDocument();
            expect(screen.getByText('Score: 0')).toBeInTheDocument();
        });

        it('increments score on fix and shows Results Screen when time is up', () => {
            const onClose = vi.fn();
            const onSave = vi.fn();

            // Render with enough students to not trigger the standard "Finished all" logic immediately
            const manyStudents = Array(20).fill(null).map((_, i) => ({ ...mockStudent, id: `${i}` }));

            render(
                <ReviewMode
                    isOpen={true}
                    students={manyStudents}
                    onClose={onClose}
                    onSave={onSave}
                    isSpeedRun={true}
                />
            );

            // Fix one
            const fixButton = screen.getAllByText('Fix Grade').find(btn => btn.classList.contains('btn-fix'));
            if (!fixButton) throw new Error('Fix button not found');
            fireEvent.click(fixButton);

            expect(screen.getByText('Score: 1')).toBeInTheDocument();

            // Advance time to zero
            act(() => {
                vi.advanceTimersByTime(60000);
            });

            expect(screen.getByText('Speed Run Complete!')).toBeInTheDocument();
            expect(screen.getByText('Total Fixes')).toBeInTheDocument();
            expect(screen.getByText('1')).toBeInTheDocument(); // The score

            // Should not close automatically
            expect(onClose).not.toHaveBeenCalled();

            // Click play again
            fireEvent.click(screen.getByText('Play Again'));
            expect(screen.queryByText('Speed Run Complete!')).not.toBeInTheDocument();
            expect(screen.getByText(/Speed Run ⏱️ 60s/)).toBeInTheDocument();
        });

        it('shows Results Screen early if all students are fixed', () => {
             render(
                <ReviewMode
                    isOpen={true}
                    students={[mockStudent]} // Only one student
                    onClose={vi.fn()}
                    onSave={vi.fn()}
                    isSpeedRun={true}
                />
            );

            const fixButton = screen.getAllByText('Fix Grade').find(btn => btn.classList.contains('btn-fix'));
            if (!fixButton) throw new Error('Fix button not found');
            fireEvent.click(fixButton);

            // Even though 60s haven't passed, we finished the list
            expect(screen.getByText('Speed Run Complete!')).toBeInTheDocument();
            expect(screen.getByText('1')).toBeInTheDocument();
        });

        it('hides timer and score when zenMode is true', () => {
            render(
                <ReviewMode
                    isOpen={true}
                    students={mockStudents}
                    onClose={vi.fn()}
                    onSave={vi.fn()}
                    isSpeedRun={true}
                    zenMode={true}
                />
            );

            expect(screen.queryByText(/Speed Run ⏱️/)).not.toBeInTheDocument();
            expect(screen.getByText('Review Anomalies')).toBeInTheDocument();
            expect(screen.queryByText(/Score:/)).not.toBeInTheDocument();
        });

        it('shows Zen Mode specific completion screen', () => {
            render(
                <ReviewMode
                    isOpen={true}
                    students={[mockStudent]}
                    onClose={vi.fn()}
                    onSave={vi.fn()}
                    isSpeedRun={true}
                    zenMode={true}
                />
            );

            const fixButton = screen.getAllByText('Fix Grade').find(btn => btn.classList.contains('btn-fix'));
            if (!fixButton) throw new Error('Fix button not found');
            fireEvent.click(fixButton);

            expect(screen.getByText('Review Complete!')).toBeInTheDocument();
            expect(screen.getByText('Great job maintaining the data!')).toBeInTheDocument();
            expect(screen.queryByText('Total Fixes')).not.toBeInTheDocument();
        });

        it('disables the timer completely in Zen Mode to prevent abrupt completions', () => {
            const onClose = vi.fn();
            const onSave = vi.fn();

            // Render with multiple students
            render(
                <ReviewMode
                    isOpen={true}
                    students={mockStudents}
                    onClose={onClose}
                    onSave={onSave}
                    isSpeedRun={true}
                    zenMode={true}
                />
            );

            // Advance time past the normal 60s limit
            act(() => {
                vi.advanceTimersByTime(65000);
            });

            // The session should NOT be forcefully completed by the timer
            expect(screen.queryByText('Review Complete!')).not.toBeInTheDocument();
            expect(screen.getByText('Review Anomalies')).toBeInTheDocument();
        });

        it('retains the success-glow animation in Zen Mode for satisfying feedback', () => {
            render(
                <ReviewMode
                    isOpen={true}
                    students={mockStudents}
                    onClose={vi.fn()}
                    onSave={vi.fn()}
                    isSpeedRun={true}
                    zenMode={true}
                />
            );

            const fixButton = screen.getAllByText('Fix Grade').find(btn => btn.classList.contains('btn-fix'));
            if (!fixButton) throw new Error('Fix button not found');

            // Check card does not have glow
            let card = screen.getByText('Review Anomalies').closest('.review-card');
            expect(card).not.toHaveClass('success-glow');

            // Trigger fix
            fireEvent.click(fixButton);

            // Card should now briefly have success-glow
            card = screen.getByText('Review Anomalies').closest('.review-card');
            expect(card).toHaveClass('success-glow');

            // Advance timers to clear the glow
            act(() => {
                vi.advanceTimersByTime(600);
            });

            // Glow should be gone
            expect(card).not.toHaveClass('success-glow');
        });
    });
});
