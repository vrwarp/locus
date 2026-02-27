import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CoPilot } from './CoPilot';
import * as pco from '../utils/pco';
import type { Student } from '../utils/pco';

// Mock dependencies
vi.mock('../utils/pco', () => ({
    fetchEvents: vi.fn(),
    fetchRecentCheckIns: vi.fn(),
}));

describe('CoPilot Component', () => {
    const mockStudents: Student[] = [
        { id: '1', name: 'Alice Wonderland', pcoGrade: 5, age: 10, isChild: true } as any
    ];
    const mockAuth = 'dGVzdDp0ZXN0'; // test:test

    beforeEach(() => {
        vi.clearAllMocks();
        (pco.fetchEvents as any).mockResolvedValue([]);
        (pco.fetchRecentCheckIns as any).mockResolvedValue([]);

        // Mock scrollIntoView for JSDOM
        Element.prototype.scrollIntoView = vi.fn();
    });

    it('renders initial greeting', async () => {
        render(<CoPilot students={mockStudents} auth={mockAuth} />);

        // Use getAllByText because the text appears in the header AND the initial message
        const elements = screen.getAllByText(/Pastoral Co-Pilot/i);
        expect(elements.length).toBeGreaterThan(0);

        // Wait for greeting
        await waitFor(() => {
            expect(screen.getByText(/Hi! I'm Locus/i)).toBeInTheDocument();
        });
    });

    it('processes user input and returns response', async () => {
        render(<CoPilot students={mockStudents} auth={mockAuth} />);

        // Wait for context load
        await waitFor(() => expect(screen.getByPlaceholderText(/Ask Locus/i)).not.toBeDisabled());

        const input = screen.getByPlaceholderText(/Ask Locus/i);
        fireEvent.change(input, { target: { value: 'What is my health score?' } });
        fireEvent.click(screen.getByText('➤'));

        // Check user message appears
        expect(screen.getByText('What is my health score?')).toBeInTheDocument();

        // Check bot response appears (after delay)
        await waitFor(() => {
            expect(screen.getByText(/Data Health Score/i)).toBeInTheDocument();
        }, { timeout: 3000 });
    });

    it('shows loading state while processing', async () => {
        const { container } = render(<CoPilot students={mockStudents} auth={mockAuth} />);
        await waitFor(() => expect(screen.getByPlaceholderText(/Ask Locus/i)).not.toBeDisabled());

        const input = screen.getByPlaceholderText(/Ask Locus/i);
        fireEvent.change(input, { target: { value: 'Test Query' } });
        fireEvent.click(screen.getByText('➤'));

        // Check for typing indicator by class name
        const indicator = container.querySelector('.typing-indicator');
        expect(indicator).toBeInTheDocument();
    });
});
