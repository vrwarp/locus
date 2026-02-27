import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FamilyModal } from './FamilyModal';

describe('FamilyModal Component', () => {
    const mockIssues = [
        {
            type: 'Critical' as const,
            message: 'Child older than Parent',
            householdId: '123',
            familyName: 'Smith',
            members: [],
            fixType: 'Swap' as const,
            studentId: '1',
            parentId: '2'
        },
        {
            type: 'Warning' as const,
            message: 'Small age gap',
            householdId: '456',
            familyName: 'Jones',
            members: []
        }
    ];

    it('renders issues list', () => {
        render(<FamilyModal isOpen={true} onClose={vi.fn()} issues={mockIssues} onFix={vi.fn()} />);

        expect(screen.getByText('Family Audit')).toBeInTheDocument();
        expect(screen.getByText(/Child older than Parent/)).toBeInTheDocument();
        expect(screen.getByText(/Small age gap/)).toBeInTheDocument();
    });

    it('renders fix button for fixable issues', () => {
        render(<FamilyModal isOpen={true} onClose={vi.fn()} issues={mockIssues} onFix={vi.fn()} />);

        const swapButton = screen.getByText('Swap Roles');
        expect(swapButton).toBeInTheDocument();
    });

    it('calls onFix when swap button clicked', () => {
        const onFix = vi.fn();
        render(<FamilyModal isOpen={true} onClose={vi.fn()} issues={mockIssues} onFix={onFix} />);

        fireEvent.click(screen.getByText('Swap Roles'));
        expect(onFix).toHaveBeenCalledWith(mockIssues[0], 'Swap');
    });

    it('does not render when closed', () => {
        const { container } = render(<FamilyModal isOpen={false} onClose={vi.fn()} issues={mockIssues} onFix={vi.fn()} />);
        expect(container).toBeEmptyDOMElement();
    });
});
