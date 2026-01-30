import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GhostModal } from './GhostModal';
import type { Student } from '../utils/pco';
import '@testing-library/jest-dom';

describe('GhostModal', () => {
    const mockStudents: Student[] = [
        {
            id: '1',
            age: 10,
            pcoGrade: 4,
            name: 'Ghost One',
            birthdate: '2014-01-01',
            calculatedGrade: 4,
            delta: 0,
            lastCheckInAt: null,
            checkInCount: null,
            groupCount: null
        },
        {
            id: '2',
            age: 12,
            pcoGrade: 6,
            name: 'Ghost Two',
            birthdate: '2012-01-01',
            calculatedGrade: 6,
            delta: 0,
            lastCheckInAt: '2020-01-01',
            checkInCount: 5,
            groupCount: 2
        }
    ];

    it('renders correctly when open', () => {
        render(
            <GhostModal
                isOpen={true}
                onClose={() => {}}
                students={mockStudents}
                onArchive={() => {}}
                onAnalyze={async () => {}}
            />
        );
        expect(screen.getByText('Ghost Protocol')).toBeInTheDocument();
        expect(screen.getByText('Ghost One')).toBeInTheDocument();
        expect(screen.getByText('Ghost Two')).toBeInTheDocument();
    });

    it('displays check-in count and group count when available', () => {
         render(
            <GhostModal
                isOpen={true}
                onClose={() => {}}
                students={mockStudents}
                onArchive={() => {}}
                onAnalyze={async () => {}}
            />
        );
        expect(screen.getByText('5 check-ins')).toBeInTheDocument();
        expect(screen.getByText('2 groups')).toBeInTheDocument();
    });

    it('does not render when closed', () => {
        const { container } = render(
            <GhostModal
                isOpen={false}
                onClose={() => {}}
                students={mockStudents}
                onArchive={() => {}}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('calls onAnalyze when button is clicked', async () => {
        const handleAnalyze = vi.fn().mockResolvedValue(undefined);
        render(
            <GhostModal
                isOpen={true}
                onClose={() => {}}
                students={mockStudents}
                onArchive={() => {}}
                onAnalyze={handleAnalyze}
            />
        );

        fireEvent.click(screen.getByText('Analyze Deeply'));
        expect(handleAnalyze).toHaveBeenCalledWith(mockStudents);
    });
});
