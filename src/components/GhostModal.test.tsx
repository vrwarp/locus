import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GhostModal } from './GhostModal';
import { vi, describe, it, expect } from 'vitest';
import type { Student } from '../utils/pco';

describe('GhostModal', () => {
    const mockOnArchive = vi.fn();
    const mockOnAnalyze = vi.fn();
    const mockOnClose = vi.fn();

    const mockStudents: Student[] = [
        {
            id: '1', name: 'Regular Ghost', age: 20, pcoGrade: 12, birthdate: '2000-01-01', calculatedGrade: 12, delta: 0,
            lastCheckInAt: null, checkInCount: 0, donationTotal: 0, groupCount: 0
        },
        {
            id: '2', name: 'High Value Donor', age: 30, pcoGrade: null as any, birthdate: '1990-01-01', calculatedGrade: 0, delta: 0,
            lastCheckInAt: null, checkInCount: 0, donationTotal: 15000, groupCount: 0 // $150
        },
        {
            id: '3', name: 'Group Member Person', age: 30, pcoGrade: null as any, birthdate: '1990-01-01', calculatedGrade: 0, delta: 0,
            lastCheckInAt: null, checkInCount: 0, donationTotal: 0, groupCount: 1
        }
    ];

    it('renders candidate count correctly', () => {
        render(
            <GhostModal
                isOpen={true}
                onClose={mockOnClose}
                students={mockStudents}
                onArchive={mockOnArchive}
                onAnalyze={mockOnAnalyze}
            />
        );

        // 1 Regular, 2 Exempt
        expect(screen.getByText('1 candidates found (2 exempt).')).toBeInTheDocument();
    });

    it('marks exempt students visually', () => {
        render(
            <GhostModal
                isOpen={true}
                onClose={mockOnClose}
                students={mockStudents}
                onArchive={mockOnArchive}
                onAnalyze={mockOnAnalyze}
            />
        );

        expect(screen.getByText('Regular Ghost')).not.toHaveStyle('text-decoration: line-through');
        expect(screen.getByText('High Value Donor')).toHaveStyle('text-decoration: line-through');
        expect(screen.getByText('Group Member Person')).toHaveStyle('text-decoration: line-through');

        expect(screen.getByText('Donor $150')).toBeInTheDocument();
        expect(screen.getByText('Group Member', { selector: 'span.tag-group' })).toBeInTheDocument();
    });

    it('only passes candidates to onArchive', () => {
         render(
            <GhostModal
                isOpen={true}
                onClose={mockOnClose}
                students={mockStudents}
                onArchive={mockOnArchive}
                onAnalyze={mockOnAnalyze}
            />
        );

        fireEvent.click(screen.getByText('Archive 1 Ghosts'));

        expect(mockOnArchive).toHaveBeenCalledWith([mockStudents[0]]);
    });

    it('disables archive button if no candidates (all exempt)', () => {
        const exemptOnly = mockStudents.slice(1);
        render(
            <GhostModal
                isOpen={true}
                onClose={mockOnClose}
                students={exemptOnly}
                onArchive={mockOnArchive}
                onAnalyze={mockOnAnalyze}
            />
        );

        // Should find text "Archive 0 Ghosts" or similar, or button disabled
        const btn = screen.getByRole('button', { name: /Archive/i });
        expect(btn).toBeDisabled();
    });
});
