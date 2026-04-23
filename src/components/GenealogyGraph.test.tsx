import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GenealogyGraph } from './GenealogyGraph';
import type { Student } from '../utils/pco';

describe('GenealogyGraph', () => {
    const mockStudents: Student[] = [
        { id: '1', name: 'John Doe', age: 40, isChild: false, householdId: 'h1', grade: null, pcoGrade: null },
        { id: '2', name: 'Jane Doe', age: 38, isChild: false, householdId: 'h1', grade: null, pcoGrade: null },
        { id: '3', name: 'Jimmy Doe', age: 10, isChild: true, householdId: 'h1', grade: 4, pcoGrade: 4 },
        { id: '4', name: 'Single Parent', age: 35, isChild: false, householdId: 'h2', grade: null, pcoGrade: null },
        { id: '5', name: 'Only Child', age: 8, isChild: true, householdId: 'h2', grade: 2, pcoGrade: 2 }
    ];

    it('renders an empty state when no students are provided', () => {
        render(<GenealogyGraph students={[]} />);
        expect(screen.getByText('Not enough household data to build a genealogy graph.')).toBeInTheDocument();
    });

    it('renders a graph with nodes for students with households', () => {
        const { container } = render(<GenealogyGraph students={mockStudents} />);

        // 5 nodes + lines
        const circles = container.querySelectorAll('circle');
        expect(circles.length).toBe(5);

        // Hover over a node to check tooltip
        fireEvent.mouseEnter(circles[0]);
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Age: 40')).toBeInTheDocument();
        expect(screen.getByText('Parent')).toBeInTheDocument();

        fireEvent.mouseLeave(circles[0]);
        expect(screen.queryByText('John Doe')).not.toBeInTheDocument();

        fireEvent.mouseEnter(circles[2]);
        expect(screen.getByText('Jimmy Doe')).toBeInTheDocument();
        expect(screen.getByText('Age: 10')).toBeInTheDocument();
        expect(screen.getByText('Child')).toBeInTheDocument();
    });

    it('renders an empty state if no students have a householdId', () => {
        const noHouseholdStudents: Student[] = [
            { id: '1', name: 'John Doe', age: 40, isChild: false, householdId: '', grade: null, pcoGrade: null }
        ];
        render(<GenealogyGraph students={noHouseholdStudents} />);
        expect(screen.getByText('Not enough household data to build a genealogy graph.')).toBeInTheDocument();
    });
});
